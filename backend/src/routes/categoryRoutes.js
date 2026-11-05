const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

// ดูหมวดหมู่ทั้งหมด (สาธารณะ)
router.get('/', categoryController.getAllCategories);

// จัดการหมวดหมู่ (เฉพาะ Admin)
router.post('/', authenticateToken, requireRole('admin'), categoryController.createCategory);
router.put('/:id', authenticateToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
