const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// ต้องเข้าสู่ระบบเพื่อใช้งานเพลย์ลิสต์
router.use(authenticateToken);

router.get('/', playlistController.getMyPlaylists);
router.post('/', playlistController.createPlaylist);
router.get('/:id', playlistController.getPlaylistById);
router.put('/:id', playlistController.updatePlaylist);
router.delete('/:id', playlistController.deletePlaylist);

// เพิ่มและลบเพลงในเพลย์ลิสต์
router.post('/:id/songs', playlistController.addSongToPlaylist);
router.delete('/:id/songs/:songId', playlistController.removeSongFromPlaylist);

module.exports = router;
