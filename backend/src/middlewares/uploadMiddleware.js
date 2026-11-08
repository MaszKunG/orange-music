const multer = require('multer');
const path = require('path');
const fs = require('fs');

const audioDir = path.resolve(__dirname, '../../uploads/audio');
const coversDir = path.resolve(__dirname, '../../uploads/covers');

if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

// กำหนด Storage สำหรับเพลงและภาพปก
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else {
      cb(null, coversDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// กรองชนิดไฟล์
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'audio') {
    const allowedExts = ['.mp3', '.wav', '.m4a'];
    const allowedMimes = [
      'audio/mpeg', 
      'audio/mp3', 
      'audio/wav', 
      'audio/x-wav', 
      'audio/wave', 
      'audio/x-m4a', 
      'audio/mp4', 
      'audio/aac'
    ];

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('ไฟล์เสียงต้องเป็นนามสกุล .mp3, .wav หรือ .m4a เท่านั้น'), false);
    }
  } else if (file.fieldname === 'cover' || file.fieldname === 'avatar') {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('รูปภาพต้องเป็นนามสกุล .jpg, .png หรือ .webp เท่านั้น'), false);
    }
  } else {
    cb(new Error('ฟิลด์ไฟล์ไม่ถูกต้อง'), false);
  }
};

const uploadSongFiles = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // สูงสุด 20MB
  }
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);

const uploadAvatarFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // สูงสุด 10MB สำหรับรูปโปรไฟล์
  }
}).single('avatar');

module.exports = {
  uploadSongFiles,
  uploadAvatarFile
};
