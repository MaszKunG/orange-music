const db = require('../config/database');

// ดึงการแจ้งเตือนทั้งหมดของผู้ใช้ปัจจุบัน
async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifications = await db.all(`
      SELECT n.*, s.title AS song_title, s.cover_path AS song_cover
      FROM notifications n
      LEFT JOIN songs s ON n.song_id = s.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 30
    `, [userId]);

    const unreadCount = await db.get(`
      SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0
    `, [userId]);

    return res.json({
      success: true,
      unreadCount: unreadCount.count || 0,
      notifications
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน' });
  }
}

// ทำเครื่องหมายอ่านแล้วสำหรับรายการเดียว
async function markAsRead(req, res) {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notifId, userId]
    );

    return res.json({ success: true, message: 'อัปเดตสถานะการแจ้งเตือนแล้ว' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตได้' });
  }
}

// ทำเครื่องหมายอ่านแล้วทั้งหมด
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);

    return res.json({ success: true, message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตได้' });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
