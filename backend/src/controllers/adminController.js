const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 1. สรุปรายงานข้อมูลสถิติ (Admin Stats พร้อมจำนวนเพลงรออนุมัติ)
async function getAdminStats(req, res) {
  try {
    // จำนวนผู้ใช้ทั้งหมดและแยกตามบทบาท
    const userRoleCounts = await db.all(`
      SELECT role, COUNT(*) AS count
      FROM users
      GROUP BY role
    `);

    const totalUsers = userRoleCounts.reduce((acc, curr) => acc + curr.count, 0);

    // จำนวนเพลงทั้งหมด และยอดวิว/การฟังรวม
    const songStats = await db.get(`
      SELECT 
        COUNT(*) AS total_songs, 
        COALESCE(SUM(play_count), 0) AS total_plays,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_songs,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_songs,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_songs
      FROM songs
    `);

    // จำนวนหมวดหมู่ทั้งหมด
    const categoryStats = await db.get(`
      SELECT COUNT(*) AS total_categories FROM categories
    `);

    // จำนวนเพลย์ลิสต์ทั้งหมด
    const playlistStats = await db.get(`
      SELECT COUNT(*) AS total_playlists FROM playlists
    `);

    // 5 เพลงยอดนิยมสูงสุด (เฉพาะเพลงที่ approved แล้ว)
    const topSongs = await db.all(`
      SELECT 
        s.id, s.title, s.artist, s.play_count, s.cover_path,
        c.name AS category_name,
        (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS like_count
      FROM songs s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.status = 'approved'
      ORDER BY s.play_count DESC
      LIMIT 5
    `);

    // สถิติเพลงแยกตามหมวดหมู่ (เฉพาะ approved)
    const categoryDistribution = await db.all(`
      SELECT c.name, COUNT(s.id) AS song_count
      FROM categories c
      LEFT JOIN songs s ON c.id = s.category_id AND s.status = 'approved'
      GROUP BY c.id
      ORDER BY song_count DESC
    `);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        userRoleCounts: {
          admin: userRoleCounts.find(r => r.role === 'admin')?.count || 0,
          uploader: userRoleCounts.find(r => r.role === 'uploader')?.count || 0,
          user: userRoleCounts.find(r => r.role === 'user')?.count || 0
        },
        totalSongs: songStats.total_songs || 0,
        totalPlays: songStats.total_plays || 0,
        pendingSongs: songStats.pending_songs || 0,
        approvedSongs: songStats.approved_songs || 0,
        rejectedSongs: songStats.rejected_songs || 0,
        totalCategories: categoryStats.total_categories || 0,
        totalPlaylists: playlistStats.total_playlists || 0,
        topSongs,
        categoryDistribution
      }
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดรายงานสรุป' });
  }
}

// 2. อนุมัติบทเพลงเดี่ยว (Approve Song)
async function approveSong(req, res) {
  try {
    const songId = req.params.id;
    const song = await db.get(`SELECT id, title, uploader_id FROM songs WHERE id = ?`, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการอนุมัติ' });
    }

    const reviewedAt = new Date().toISOString();
    await db.run(`
      UPDATE songs 
      SET status = 'approved', reviewed_by = ?, reviewed_at = ?, reject_reason = NULL 
      WHERE id = ?
    `, [req.user.id, reviewedAt, songId]);

    // สร้างการแจ้งเตือนส่งให้ผู้อัปโหลด
    await db.run(`
      INSERT INTO notifications (user_id, title, message, song_id, is_read)
      VALUES (?, ?, ?, ?, 0)
    `, [
      song.uploader_id,
      'ยินดีด้วย! เพลงของคุณได้รับการอนุมัติแล้ว',
      `บทเพลง "${song.title}" ผ่านการตรวจสอบจากผู้ดูแลระบบและเผยแพร่สู่ผู้ฟังบน Orange Music เรียบร้อยแล้ว`,
      songId
    ]);

    const updated = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    return res.json({
      success: true,
      message: `อนุมัติเพลง "${song.title}" สำเร็จเรียบร้อย เพลงจะปรากฏบนเว็บไซต์ทันที`,
      song: updated
    });
  } catch (err) {
    console.error('Approve song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติเพลง' });
  }
}

// 3. ไม่อนุมัติบทเพลง (Reject Song พร้อมเหตุผล)
async function rejectSong(req, res) {
  try {
    const songId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลที่ไม่อนุมัติบทเพลงนี้ทุกครั้ง' });
    }

    const song = await db.get(`SELECT id, title, uploader_id FROM songs WHERE id = ?`, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการตรวจสอบ' });
    }

    const reviewedAt = new Date().toISOString();
    await db.run(`
      UPDATE songs 
      SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ? 
      WHERE id = ?
    `, [req.user.id, reviewedAt, reason.trim(), songId]);

    // สร้างการแจ้งเตือนส่งให้ผู้อัปโหลด
    await db.run(`
      INSERT INTO notifications (user_id, title, message, song_id, is_read)
      VALUES (?, ?, ?, ?, 0)
    `, [
      song.uploader_id,
      `ผลการตรวจสอบเพลง: ${song.title}`,
      `เพลงของคุณไม่ผ่านการอนุมัติเนื่องจาก: ${reason.trim()} (คุณสามารถแก้ไขไฟล์หรือรายละเอียดแล้วส่งตรวจอีกครั้งได้)`,
      songId
    ]);

    const updated = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    return res.json({
      success: true,
      message: `ปฏิเสธการอนุมัติเพลง "${song.title}" เรียบร้อยแล้ว ผู้อัปโหลดจะได้รับแจ้งเตือนพร้อมเหตุผล`,
      song: updated
    });
  } catch (err) {
    console.error('Reject song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการปฏิเสธเพลง' });
  }
}

// 4. อนุมัติเพลงหลายรายการพร้อมกัน (Bulk Approve)
async function bulkApproveSongs(req, res) {
  try {
    const { song_ids } = req.body;

    if (!Array.isArray(song_ids) || song_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกเพลงที่ต้องการอนุมัติอย่างน้อย 1 เพลง' });
    }

    const reviewedAt = new Date().toISOString();
    let approvedCount = 0;

    for (const songId of song_ids) {
      const song = await db.get(`SELECT id, title, uploader_id FROM songs WHERE id = ?`, [songId]);
      if (song) {
        await db.run(`
          UPDATE songs 
          SET status = 'approved', reviewed_by = ?, reviewed_at = ?, reject_reason = NULL 
          WHERE id = ?
        `, [req.user.id, reviewedAt, song.id]);

        await db.run(`
          INSERT INTO notifications (user_id, title, message, song_id, is_read)
          VALUES (?, ?, ?, ?, 0)
        `, [
          song.uploader_id,
          'ยินดีด้วย! เพลงของคุณได้รับการอนุมัติแล้ว',
          `บทเพลง "${song.title}" ผ่านการตรวจสอบจากผู้ดูแลระบบและเผยแพร่เรียบร้อยแล้ว`,
          song.id
        ]);
        approvedCount++;
      }
    }

    return res.json({
      success: true,
      message: `อนุมัติเพลงเรียบร้อยแล้วทั้งหมด ${approvedCount} เพลง`
    });
  } catch (err) {
    console.error('Bulk approve error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติเพลงพร้อมกัน' });
  }
}

// 5. จัดการผู้ใช้งาน
async function getAllUsers(req, res) {
  try {
    const { search, role } = req.query;

    let query = `
      SELECT id, username, email, full_name, role, avatar, created_at,
             (SELECT COUNT(*) FROM songs WHERE uploader_id = users.id) AS uploaded_songs_count
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (role && ['admin', 'uploader', 'user'].includes(role)) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC`;

    const users = await db.all(query, params);
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
}

// 6. เพิ่มผู้ใช้งานโดยแอดมิน
async function createUserByAdmin(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    if (!['admin', 'uploader', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'บทบาทผู้ใช้ไม่ถูกต้อง' });
    }

    // ข้อกำหนดสิทธิ์: เฉพาะ Masz เท่านั้นที่สามารถสร้างบัญชีที่มียศ Admin ได้
    const isMasz = req.user && req.user.username && req.user.username.toLowerCase() === 'masz';
    if (role === 'admin' && !isMasz) {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบ Masz เท่านั้นที่สามารถแต่งตั้งยศ Admin ให้กับผู้อื่นได้'
      });
    }

    const existing = await db.get(
      `SELECT id FROM users WHERE username = ? OR email = ?`,
      [username.trim(), email.trim().toLowerCase()]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
    const displayName = full_name && full_name.trim() !== '' ? full_name.trim() : username.trim();

    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), password_hash, displayName, role, defaultAvatar]
    );

    const newUser = await db.get(
      `SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?`,
      [result.id]
    );

    return res.status(201).json({
      success: true,
      message: 'เพิ่มผู้ใช้งานสำเร็จ',
      user: newUser
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน' });
  }
}

// 7. แก้ไขข้อมูลผู้ใช้งานโดยแอดมิน
async function updateUserByAdmin(req, res) {
  try {
    const targetUserId = req.params.id;
    const { full_name, email, role, password } = req.body;

    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [targetUserId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไข' });
    }

    let updatedFullName = full_name ? full_name.trim() : user.full_name;
    let updatedEmail = email ? email.trim().toLowerCase() : user.email;
    let updatedRole = role && ['admin', 'uploader', 'user'].includes(role) ? role : user.role;
    let updatedPasswordHash = user.password_hash;

    // ข้อกำหนดสิทธิ์พิเศษสำหรับ Masz:
    const isMasz = req.user && req.user.username && req.user.username.toLowerCase() === 'masz';
    const isTargetMasz = user.username.toLowerCase() === 'masz';

    // 1. ห้ามใครก็ตามปลดยศหรือเปลี่ยนบทบาทของ Masz
    if (isTargetMasz && updatedRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่อนุญาตให้ปลดยศหรือเปลี่ยนบทบาทของผู้ดูแลระบบ Masz'
      });
    }

    // 2. เฉพาะ Masz เท่านั้นที่สามารถแต่งตั้งยศ Admin ให้คนอื่น หรือถอดยศ Admin ได้
    if ((updatedRole === 'admin' || user.role === 'admin') && !isMasz && user.role !== updatedRole) {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบ Masz เท่านั้นที่สามารถแต่งตั้งหรือถอดยศ Admin ให้กับผู้อื่นได้'
      });
    }

    if (password && password.length >= 6) {
      updatedPasswordHash = await bcrypt.hash(password, 10);
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const emailDup = await db.get(`SELECT id FROM users WHERE email = ? AND id != ?`, [updatedEmail, targetUserId]);
      if (emailDup) {
        return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
      }
    }

    await db.run(
      `UPDATE users SET full_name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?`,
      [updatedFullName, updatedEmail, updatedRole, updatedPasswordHash, targetUserId]
    );

    const updated = await db.get(
      `SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?`,
      [targetUserId]
    );

    return res.json({
      success: true,
      message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ',
      user: updated
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้' });
  }
}

// 8. ลบผู้ใช้งาน (ห้ามลบตัวเอง)
async function deleteUserByAdmin(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);

    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'ไม่อนุญาตให้ลบบัญชีของตนเอง' });
    }

    const user = await db.get(`SELECT id, username FROM users WHERE id = ?`, [targetUserId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
    }

    if (user.username.toLowerCase() === 'masz') {
      return res.status(403).json({
        success: false,
        message: 'ไม่อนุญาตให้ลบบัญชีผู้ดูแลระบบ Masz'
      });
    }

    await db.run(`DELETE FROM users WHERE id = ?`, [targetUserId]);

    return res.json({
      success: true,
      message: `ลบผู้ใช้งาน "${user.username}" สำเร็จเรียบร้อย`
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' });
  }
}

module.exports = {
  getAdminStats,
  approveSong,
  rejectSong,
  bulkApproveSongs,
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin
};
