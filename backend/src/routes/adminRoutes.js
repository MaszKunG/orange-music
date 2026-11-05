const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const songController = require('../controllers/songController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

// สำหรับผู้ดูแลระบบเท่านั้น
router.use(authenticateToken);
router.use(requireRole('admin'));

// รายงานสรุปสถิติ & กราฟ
router.get('/stats', adminController.getAdminStats);

// จัดการผู้ใช้งาน
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUserByAdmin);
router.put('/users/:id', adminController.updateUserByAdmin);
router.delete('/users/:id', adminController.deleteUserByAdmin);

// ตรวจสอบและจัดการบทเพลง
router.get('/songs', songController.getAllSongs);
router.patch('/songs/:id/approve', adminController.approveSong);
router.patch('/songs/:id/reject', adminController.rejectSong);
router.post('/songs/bulk-approve', adminController.bulkApproveSongs);
router.delete('/songs/:id', songController.deleteSong);

module.exports = router;
