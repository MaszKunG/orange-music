const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', likeController.getLikedSongs);
router.post('/:songId', likeController.toggleLike);

module.exports = router;
