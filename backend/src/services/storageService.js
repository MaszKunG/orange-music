const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// ตรวจสอบการตั้งค่า Cloudflare R2
const isR2Configured = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

let r2Client = null;
if (isR2Configured) {
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    console.log('☁️ เปิดใช้งาน Cloudflare R2 Cloud Storage สำเร็จสำหรับ Bucket:', process.env.R2_BUCKET_NAME);
  } catch (err) {
    console.error('❌ ไม่สามารถเริ่มต้นเชื่อมต่อ Cloudflare R2 ได้:', err.message);
  }
}

/**
 * จัดการอัปโหลดไฟล์ (รองรับทั้ง Cloudflare R2 และ Local Storage)
 * @param {Object} file - วัตถุไฟล์จาก Multer
 * @param {string} folder - โฟลเดอร์ปลายทาง เช่น 'audio', 'covers', 'avatars'
 * @returns {Promise<string>} พาธหรือ URL สาธารณะของไฟล์
 */
async function saveUploadedFile(file, folder) {
  if (!file) return null;

  // โหมด Cloudflare R2
  if (isR2Configured && r2Client) {
    try {
      const fileStream = fs.createReadStream(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueFilename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: fileStream,
        ContentType: file.mimetype,
      });

      await r2Client.send(command);

      // ลบไฟล์ชั่วคราวบนดิสก์เครื่องหลังจากอัปโหลดขึ้น R2 สำเร็จ
      fs.unlink(file.path, () => {});

      // ถ้ามีการตั้งค่า Custom Domain หรือ R2 Public URL
      if (process.env.R2_PUBLIC_URL) {
        const publicBase = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
        return `${publicBase}/${uniqueFilename}`;
      }

      // หากไม่ได้กำหนด URL สาธารณะ คืนค่า key ของ R2
      return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFilename}`;
    } catch (err) {
      console.error('❌ ไม่สามารถอัปโหลดไปยัง Cloudflare R2 ได้:', err.message);
      // หากเกิดข้อผิดพลาด ใช้ local path ชั่วคราว
      return `/uploads/${folder}/${file.filename}`;
    }
  }

  // โหมด Local Storage (ค่าเริ่มต้น)
  return `/uploads/${folder}/${file.filename}`;
}

/**
 * ลบไฟล์ (ถ้าต้องการ)
 */
async function deleteFile(fileUrl) {
  if (!fileUrl) return;

  if (isR2Configured && r2Client && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.replace(/^\//, '');
      await r2Client.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key
      }));
    } catch (err) {
      console.error('Failed to delete from R2:', err.message);
    }
  } else if (fileUrl.startsWith('/uploads/')) {
    const localPath = path.resolve(__dirname, '../../', fileUrl.replace(/^\//, ''));
    fs.unlink(localPath, () => {});
  }
}

module.exports = {
  isR2Configured,
  saveUploadedFile,
  deleteFile
};
