const db = require('../config/database');

// ดึงรายการเพลงที่ผู้ใช้ปัจจุบันถูกใจ
async function getLikedSongs(req, res) {
  try {
    const userId = req.user.id;

    const songs = await db.all(`
      SELECT 
        s.id, s.title, s.artist, s.category_id, s.uploader_id, s.description, 
        s.lyrics, s.audio_path, s.cover_path, s.play_count, s.created_at,
        c.name AS category_name,
        u.full_name AS uploader_name,
        l.created_at AS liked_at,
        1 AS is_liked,
        (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS like_count
      FROM likes l
      JOIN songs s ON l.song_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.uploader_id = u.id
      WHERE l.user_id = ? AND s.status = 'approved'
      ORDER BY l.created_at DESC
    `, [userId]);

    return res.json({ success: true, count: songs.length, songs });
  } catch (err) {
    console.error('Get liked songs error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดเพลงที่ถูกใจ' });
  }
}

// สลับสถานะถูกใจเพลง (Like / Unlike)
async function toggleLike(req, res) {
  try {
    const userId = req.user.id;
    const songId = req.params.songId;

    const song = await db.get(`SELECT id FROM songs WHERE id = ?`, [songId]);
    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการ' });
    }

    const existing = await db.get(
      `SELECT * FROM likes WHERE user_id = ? AND song_id = ?`,
      [userId, songId]
    );

    let isLiked = false;
    if (existing) {
      await db.run(`DELETE FROM likes WHERE user_id = ? AND song_id = ?`, [userId, songId]);
      isLiked = false;
    } else {
      await db.run(`INSERT INTO likes (user_id, song_id) VALUES (?, ?)`, [userId, songId]);
      isLiked = true;
    }

    const likeCountResult = await db.get(`SELECT COUNT(*) AS count FROM likes WHERE song_id = ?`, [songId]);

    return res.json({
      success: true,
      message: isLiked ? 'เพิ่มลงในเพลงที่ถูกใจแล้ว' : 'นำออกจากเพลงที่ถูกใจแล้ว',
      is_liked: isLiked,
      like_count: likeCountResult.count
    });
  } catch (err) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกดถูกใจ' });
  }
}

module.exports = {
  getLikedSongs,
  toggleLike
};
