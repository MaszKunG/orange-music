const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ขนาดไฟล์เกินกำหนด (ไฟล์เสียงต้องไม่เกิน 20MB และรูปภาพต้องไม่เกิน 10MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    });
  }

  next();
}

module.exports = { errorHandler };
