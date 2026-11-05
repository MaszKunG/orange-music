const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'orange_music_super_secret_jwt_key_2026';

// Middleware ตรวจสอบ JWT Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(`SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?`, [decoded.id]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานในระบบ' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
  }
}

// Middleware สำหรับ Endpoint ที่สามารถเข้าถึงได้ทั้งผู้ใช้ทั่วไปและแขก (Guest)
async function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(`SELECT id, username, email, full_name, role, avatar FROM users WHERE id = ?`, [decoded.id]);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

// Middleware ตรวจสอบสิทธิ์ตามบทบาท (Role-based Access Control)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (สำหรับ ' + roles.join(' หรือ ') + ' เท่านั้น)' 
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalToken,
  requireRole,
  JWT_SECRET
};
