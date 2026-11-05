const db = require('../config/database');

// ดึงหมวดหมู่ทั้งหมด พร้อมจำนวนเพลงในหมวดนั้น
async function getAllCategories(req, res) {
  try {
    const categories = await db.all(`
      SELECT 
        c.id, c.name, c.description,
        COUNT(s.id) AS song_count
      FROM categories c
      LEFT JOIN songs s ON c.id = s.category_id AND s.status = 'approved'
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    return res.json({ success: true, categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดหมวดหมู่' });
  }
}

// สร้างหมวดหมู่ใหม่ (เฉพาะ Admin)
async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อหมวดหมู่' });
    }

    const existing = await db.get(`SELECT id FROM categories WHERE name = ?`, [name.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'มีหมวดหมู่นี้อยู่ในระบบแล้ว' });
    }

    const result = await db.run(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name.trim(), description ? description.trim() : '']
    );

    const newCategory = await db.get(`SELECT * FROM categories WHERE id = ?`, [result.id]);

    return res.status(201).json({
      success: true,
      message: 'เพิ่มหมวดหมู่สำเร็จ',
      category: newCategory
    });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' });
  }
}

// แก้ไขหมวดหมู่ (เฉพาะ Admin)
async function updateCategory(req, res) {
  try {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อหมวดหมู่' });
    }

    const existing = await db.get(`SELECT id FROM categories WHERE id = ?`, [categoryId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
    }

    // ตรวจสอบชื่อซ้ำกับรายการอื่น
    const duplicate = await db.get(
      `SELECT id FROM categories WHERE name = ? AND id != ?`,
      [name.trim(), categoryId]
    );
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'มีชื่อหมวดหมู่นี้อยู่แล้ว' });
    }

    await db.run(
      `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
      [name.trim(), description ? description.trim() : '', categoryId]
    );

    const updated = await db.get(`SELECT * FROM categories WHERE id = ?`, [categoryId]);

    return res.json({
      success: true,
      message: 'บันทึกการแก้ไขหมวดหมู่สำเร็จ',
      category: updated
    });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่' });
  }
}

// ลบหมวดหมู่ (เฉพาะ Admin)
async function deleteCategory(req, res) {
  try {
    const categoryId = req.params.id;

    const existing = await db.get(`SELECT id FROM categories WHERE id = ?`, [categoryId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
    }

    // เมื่อลบหมวดหมู่ เพลงที่อยู่ในหมวดนี้จะกลายเป็น category_id = NULL ตาม foreign key
    await db.run(`DELETE FROM categories WHERE id = ?`, [categoryId]);

    return res.json({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จเรียบร้อย'
    });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
