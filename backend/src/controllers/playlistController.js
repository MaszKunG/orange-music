const db = require('../config/database');

// ดึงเพลย์ลิสต์ทั้งหมดของผู้ใช้ปัจจุบัน
async function getMyPlaylists(req, res) {
  try {
    const userId = req.user.id;

    const playlists = await db.all(`
      SELECT 
        p.id, p.name, p.created_at,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS song_count,
        (SELECT s.cover_path FROM playlist_songs ps2 
         JOIN songs s ON ps2.song_id = s.id 
         WHERE ps2.playlist_id = p.id AND s.status = 'approved'
         ORDER BY ps2.added_at DESC LIMIT 1) AS cover_path
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      LEFT JOIN songs s ON ps.song_id = s.id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);

    return res.json({ success: true, playlists });
  } catch (err) {
    console.error('Get my playlists error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงเพลย์ลิสต์' });
  }
}

// ดึงรายละเอียดเพลย์ลิสต์พร้อมเพลงทั้งหมดในเพลย์ลิสต์
async function getPlaylistById(req, res) {
  try {
    const playlistId = req.params.id;
    const currentUserId = req.user.id;

    const playlist = await db.get(`
      SELECT p.*, u.full_name AS creator_name
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [playlistId]);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลย์ลิสต์ที่ต้องการ' });
    }

    // ตรวจสอบว่าเป็นเจ้าของ หรือเปิดให้อ่าน
    const songs = await db.all(`
      SELECT 
        s.id, s.title, s.artist, s.category_id, s.uploader_id, s.audio_path, s.cover_path, s.play_count,
        c.name AS category_name,
        ps.added_at,
        (SELECT COUNT(*) FROM likes WHERE song_id = s.id AND user_id = ?) > 0 AS is_liked
      FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ps.playlist_id = ? AND s.status = 'approved'
      ORDER BY ps.added_at ASC
    `, [currentUserId, playlistId]);

    return res.json({
      success: true,
      playlist: {
        ...playlist,
        songs
      }
    });
  } catch (err) {
    console.error('Get playlist by id error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดเพลย์ลิสต์' });
  }
}

// สร้างเพลย์ลิสต์ใหม่
async function createPlaylist(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อเพลย์ลิสต์' });
    }

    const result = await db.run(
      `INSERT INTO playlists (user_id, name) VALUES (?, ?)`,
      [userId, name.trim()]
    );

    const newPlaylist = await db.get(`SELECT * FROM playlists WHERE id = ?`, [result.id]);

    return res.status(201).json({
      success: true,
      message: 'สร้างเพลย์ลิสต์สำเร็จ',
      playlist: newPlaylist
    });
  } catch (err) {
    console.error('Create playlist error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างเพลย์ลิสต์' });
  }
}

// เปลี่ยนชื่อเพลย์ลิสต์
async function updatePlaylist(req, res) {
  try {
    const playlistId = req.params.id;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อเพลย์ลิสต์' });
    }

    const playlist = await db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId]);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลย์ลิสต์' });
    }

    if (playlist.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขเพลย์ลิสต์นี้' });
    }

    await db.run(`UPDATE playlists SET name = ? WHERE id = ?`, [name.trim(), playlistId]);

    const updated = await db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId]);

    return res.json({
      success: true,
      message: 'แก้ไขชื่อเพลย์ลิสต์สำเร็จ',
      playlist: updated
    });
  } catch (err) {
    console.error('Update playlist error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขเพลย์ลิสต์' });
  }
}

// ลบเพลย์ลิสต์
async function deletePlaylist(req, res) {
  try {
    const playlistId = req.params.id;
    const userId = req.user.id;

    const playlist = await db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId]);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลย์ลิสต์' });
    }

    if (playlist.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบเพลย์ลิสต์นี้' });
    }

    await db.run(`DELETE FROM playlists WHERE id = ?`, [playlistId]);

    return res.json({
      success: true,
      message: 'ลบเพลย์ลิสต์สำเร็จเรียบร้อย'
    });
  } catch (err) {
    console.error('Delete playlist error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเพลย์ลิสต์' });
  }
}

// เพิ่มเพลงลงในเพลย์ลิสต์
async function addSongToPlaylist(req, res) {
  try {
    const playlistId = req.params.id;
    const { song_id } = req.body;
    const userId = req.user.id;

    if (!song_id) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเพลงที่ต้องการเพิ่ม' });
    }

    const playlist = await db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId]);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลย์ลิสต์' });
    }

    if (playlist.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เพิ่มเพลงลงในเพลย์ลิสต์นี้' });
    }

    const song = await db.get(`SELECT id FROM songs WHERE id = ?`, [song_id]);
    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการเพิ่ม' });
    }

    // ตรวจสอบว่ามีเพลงนี้ในเพลย์ลิสต์หรือยัง
    const existing = await db.get(
      `SELECT * FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`,
      [playlistId, song_id]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'เพลงนี้อยู่ในเพลย์ลิสต์แล้ว' });
    }

    await db.run(
      `INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)`,
      [playlistId, song_id]
    );

    return res.status(201).json({
      success: true,
      message: 'เพิ่มเพลงลงเพลย์ลิสต์สำเร็จ'
    });
  } catch (err) {
    console.error('Add song to playlist error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มเพลงลงเพลย์ลิสต์' });
  }
}

// ลบเพลงออกจากเพลย์ลิสต์
async function removeSongFromPlaylist(req, res) {
  try {
    const playlistId = req.params.id;
    const songId = req.params.songId;
    const userId = req.user.id;

    const playlist = await db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId]);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลย์ลิสต์' });
    }

    if (playlist.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบเพลงออกจากเพลย์ลิสต์นี้' });
    }

    await db.run(
      `DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`,
      [playlistId, songId]
    );

    return res.json({
      success: true,
      message: 'ลบเพลงออกจากเพลย์ลิสต์สำเร็จ'
    });
  } catch (err) {
    console.error('Remove song from playlist error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเพลง' });
  }
}

module.exports = {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
};
