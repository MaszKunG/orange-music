const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { uploadAvatarFile } = require('../middlewares/uploadMiddleware');

// สมัครสมาชิก
router.post('/register', authController.register);

// เข้าสู่ระบบ
router.post('/login', authController.login);

// ข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', authenticateToken, authController.getMe);

// แก้ไขโปรไฟล์ส่วนตัว
router.put('/profile', authenticateToken, uploadAvatarFile, authController.updateProfile);

module.exports = router;
