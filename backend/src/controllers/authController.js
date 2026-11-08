const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { saveUploadedFile } = require('../services/storageService');

// สมัครสมาชิก (เฉพาะบทบาท 'user' หรือ 'uploader')
async function register(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    const displayName = (full_name && full_name.trim() !== '') ? full_name.trim() : username.trim();

    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    // ข้อกำหนด: ผู้ใช้สมัครสมาชิกเองได้เฉพาะบทบาท user และ uploader เท่านั้น
    // ข้อยกเว้น: บัญชี Masz จะได้รับยศ Admin สูงสุดโดยอัตโนมัติ
    let assignedRole = (role === 'uploader') ? 'uploader' : 'user';
    if (username.trim().toLowerCase() === 'masz') {
      assignedRole = 'admin';
    }

    // ตรวจสอบชื่อผู้ใช้และอีเมลซ้ำ
    const existing = await db.get(
      `SELECT id, username, email FROM users WHERE username = ? OR email = ?`,
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing) {
      if (existing.username.toLowerCase() === username.trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' });
      }
      return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), password_hash, displayName, assignedRole, defaultAvatar]
    );

    const token = jwt.sign(
      { id: result.id, role: assignedRole, username: username.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newUser = await db.get(
      `SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?`,
      [result.id]
    );

    return res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ Orange Music!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
}

// เข้าสู่ระบบ
async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน' });
    }

    const identifier = usernameOrEmail.trim().toLowerCase();
    const user = await db.get(
      `SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?`,
      [identifier, identifier]
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: `ยินดีต้อนรับกลับ ${user.full_name}!`,
      token,
      user: userInfo
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
}

// ข้อมูลตนเอง (Current User Profile)
async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

// อัปเดตข้อมูลตนเอง
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { full_name, avatar, current_password, new_password } = req.body;

    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    let updatedFullName = full_name ? full_name.trim() : user.full_name;
    let updatedAvatar = avatar || user.avatar;
    let updatedPasswordHash = user.password_hash;

    // ถ้ามีการขอเปลี่ยนรหัสผ่าน
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยัน' });
      }
      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }
      updatedPasswordHash = await bcrypt.hash(new_password, 10);
    }

    // ถ้ามีการอัปโหลด avatar ผ่าน multipart form
    if (req.file) {
      updatedAvatar = await saveUploadedFile(req.file, 'covers');
    }

    await db.run(
      `UPDATE users SET full_name = ?, avatar = ?, password_hash = ? WHERE id = ?`,
      [updatedFullName, updatedAvatar, updatedPasswordHash, userId]
    );

    const updatedUser = await db.get(
      `SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลได้' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
