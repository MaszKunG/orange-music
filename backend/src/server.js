const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./seed/seedData');
const { errorHandler } = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const likeRoutes = require('./routes/likeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware พื้นฐาน
app.use(cors({
  origin: '*', // เพื่อความสะดวกในการเชื่อมต่อจาก Vite Frontend
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟ Static Files สำหรับไฟล์เพลงและรูปภาพที่อัปโหลด
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Orange Music API', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// เริ่มต้นฐานข้อมูลและรันเซิร์ฟเวอร์
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🍊 เซิร์ฟเวอร์ Orange Music API พร้อมให้บริการที่ http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ ไม่สามารถเริ่มต้นเซิร์ฟเวอร์ได้:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
