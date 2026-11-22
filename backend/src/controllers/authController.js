const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { saveUploadedFile } = require('../services/storageService');
const { sendPasswordResetEmail } = require('../services/emailService');

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

    // ถ้ามีการอัปโหลด avatar ผ่าน multipart form หรือส่งเป็น Data URL
    if (req.file) {
      updatedAvatar = await saveUploadedFile(req.file, 'avatars');
    } else if (avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
      updatedAvatar = avatar;
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

// ขอรหัสยืนยัน OTP รีเซ็ตรหัสผ่าน ส่งไปยังอีเมลอัตโนมัติ
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลที่ลงทะเบียนไว้' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ค้นหาผู้ใช้จากอีเมล
    const user = await db.get(
      `SELECT id, username, email FROM users WHERE LOWER(email) = ?`,
      [cleanEmail]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้ที่ลงทะเบียนด้วยอีเมลนี้ในระบบ'
      });
    }

    // สร้างรหัส OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // กำหนดเวลาหมดอายุ 15 นาที
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // ยกเลิก OTP เก่าที่ยังไม่ได้ใช้ของอีเมลนี้
    await db.run(
      `UPDATE password_resets SET used = 1 WHERE LOWER(email) = ? AND used = 0`,
      [cleanEmail]
    );

    // บันทึก OTP ใหม่ลงในฐานข้อมูล
    await db.run(
      `INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)`,
      [cleanEmail, otp, expiresAt]
    );

    // ส่งอีเมลพร้อมรหัสยืนยัน OTP อัตโนมัติ
    await sendPasswordResetEmail(user.email, user.username, otp);

    return res.json({
      success: true,
      message: 'ระบบได้ส่งรหัสยืนยัน (OTP) ไปที่อีเมลของคุณเรียบร้อยแล้ว กรุณาตรวจสอบกล่องข้อความหรืออีเมลขยะ',
      email: user.email,
      // แนบ dev_otp เพื่อความสะดวกในการทดสอบพัฒนา
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งรหัสยืนยัน' });
  }
}

// ตรวจสอบความถูกต้องของรหัสยืนยัน OTP
async function verifyResetOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสยืนยัน 6 หลัก' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const record = await db.get(
      `SELECT * FROM password_resets 
       WHERE LOWER(email) = ? AND otp = ? AND used = 0 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'รหัสยืนยันไม่ถูกต้อง หรือถูกใช้งานไปแล้ว'
      });
    }

    const now = new Date();
    const expires = new Date(record.expires_at);
    if (now > expires) {
      return res.status(400).json({
        success: false,
        message: 'รหัสยืนยันหมดอายุแล้ว (อายุ 15 นาที) กรุณากดขอรหัสใหม่อีกครั้ง'
      });
    }

    return res.json({
      success: true,
      message: 'รหัสยืนยันถูกต้อง กรุณาตั้งรหัสผ่านใหม่'
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสยืนยัน' });
  }
}

// ตั้งรหัสผ่านใหม่ (Reset Password)
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // ตรวจสอบ OTP อีกครั้งเพื่อความปลอดภัย
    const record = await db.get(
      `SELECT * FROM password_resets 
       WHERE LOWER(email) = ? AND otp = ? AND used = 0 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'รหัสยืนยันไม่ถูกต้องหรือถูกใช้งานไปแล้ว'
      });
    }

    const now = new Date();
    const expires = new Date(record.expires_at);
    if (now > expires) {
      return res.status(400).json({
        success: false,
        message: 'รหัสยืนยันหมดอายุแล้ว กรุณากดขอรหัสใหม่อีกครั้ง'
      });
    }

    // แฮชรหัสผ่านใหม่ด้วย bcrypt
    const password_hash = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านใหม่ของผู้ใช้
    await db.run(
      `UPDATE users SET password_hash = ? WHERE LOWER(email) = ?`,
      [password_hash, cleanEmail]
    );

    // ทำเครื่องหมายว่า OTP นี้ถูกใช้งานแล้ว
    await db.run(
      `UPDATE password_resets SET used = 1 WHERE id = ?`,
      [record.id]
    );

    return res.json({
      success: true,
      message: 'ตั้งรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
