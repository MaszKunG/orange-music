const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { authenticateToken, optionalToken, requireRole } = require('../middlewares/authMiddleware');
const { uploadSongFiles } = require('../middlewares/uploadMiddleware');

// ดูเพลงทั้งหมด (ค้นหา, filter หมวดหมู่, เรียงตามความนิยม)
router.get('/', optionalToken, songController.getAllSongs);

// ดูรายละเอียดเพลงเดี่ยว
router.get('/:id', optionalToken, songController.getSongById);

// อัปโหลดเพลงใหม่ (เฉพาะ Uploader หรือ Admin)
router.post('/', authenticateToken, requireRole(['uploader', 'admin']), uploadSongFiles, songController.uploadSong);

// แก้ไขเพลง (เจ้าของเพลง หรือ Admin)
router.put('/:id', authenticateToken, uploadSongFiles, songController.updateSong);

// ส่งตรวจเพลงอีกครั้ง (เฉพาะเจ้าของเพลง)
router.patch('/:id/resubmit', authenticateToken, songController.resubmitSong);

// ลบเพลง (เจ้าของเพลง หรือ Admin)
router.delete('/:id', authenticateToken, songController.deleteSong);

module.exports = router;
