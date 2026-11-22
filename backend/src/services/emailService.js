const nodemailer = require('nodemailer');

let transporter = null;

// สร้างหรือดึง Transporter สำหรับส่งอีเมล
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : '';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  // ลบช่องว่างออกอัตโนมัติ เผื่อผู้ใช้คัดลอก App Password ของ Google ที่มีช่องว่างมา
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (host && user && pass) {
    // ใช้ SMTP จาก Environment Variables (เช่น Gmail, Brevo, SendGrid ฯลฯ)
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true, // เปิด Connection Pooling เพื่อเชื่อมต่อค้างไว้ ไม่ต้อง Handshake ใหม่ทุกครั้ง
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`📧 ระบบอีเมล: เชื่อมต่อ SMTP Server ที่ ${host}:${port} (Pooled)`);
  } else {
    // ถ้ายังไม่ได้ตั้งค่า SMTP ให้จำลองการส่ง และใช้อีเมลทดสอบ Ethereal หรือ Console Log
    console.log('📧 ระบบอีเมล: ยังไม่ได้ระบุ SMTP credentials ใน .env (จะแสดงรหัสยืนยันในคอนโซลและคืนค่าเพื่อความสะดวกในการทดสอบ)');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      // Mock transporter
      transporter = {
        sendMail: async (opts) => ({ messageId: 'mock-id', mock: true })
      };
    }
  }

  return transporter;
}

/**
 * ส่งรหัสยืนยัน (OTP) สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของผู้ใช้
 */
async function sendPasswordResetEmail(toEmail, username, otp) {
  const mailTransporter = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Orange Music 🍊" <no-reply@orange.music>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #121212; color: #FFFFFF; margin: 0; padding: 0; }
        .container { max-width: 540px; margin: 30px auto; background-color: #1A1A1A; border: 1px solid #333333; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #FF7A00 0%, #E06900 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #000000; margin: 0; font-size: 24px; font-weight: 900; }
        .header p { color: rgba(0,0,0,0.7); margin: 5px 0 0; font-size: 13px; font-weight: bold; }
        .body { padding: 30px 25px; line-height: 1.6; color: #E0E0E0; }
        .body p { font-size: 14px; margin: 0 0 15px; }
        .otp-box { background: #252525; border: 2px dashed #FF7A00; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FF7A00; font-family: monospace; }
        .otp-note { font-size: 11px; color: #888888; margin-top: 8px; }
        .footer { background: #141414; border-top: 1px solid #282828; padding: 20px; text-align: center; font-size: 11px; color: #666666; }
        .highlight { color: #FF7A00; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍊 Orange Music</h1>
          <p>ส้ม • ฟังเพลงฟรีเพื่อการเรียนรู้</p>
        </div>
        <div class="body">
          <p>สวัสดีคุณ <span class="highlight">${username}</span>,</p>
          <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี Orange Music ของคุณ โปรดใช้รหัสยืนยัน (OTP) ด้านล่างนี้เพื่อตั้งรหัสผ่านใหม่:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-note">⏱️ รหัสนี้มีอายุการใช้งาน 15 นาที</div>
          </div>

          <p style="font-size: 12px; color: #A0A0A0;">
            ⚠️ <strong>ข้อควรระวัง:</strong> อย่าเปิดเผยรหัสนี้แก่ผู้อื่นเป็นอันขาด หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ คุณสามารถเพิกเฉยต่ออีเมลฉบับนี้ได้อย่างปลอดภัย บัญชีของคุณจะยังคงปลอดภัย
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Orange Music. สงวนลิขสิทธิ์ทั้งหมดเพื่อการศึกษา<br>
          อีเมลนี้ถูกส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n========================================`);
  console.log(`🔑 [EMAIL OTP FORGOT PASSWORD]`);
  console.log(`👤 ผู้ใช้: ${username} (${toEmail})`);
  console.log(`🔢 รหัสยืนยัน OTP: ${otp}`);
  console.log(`⏱️ หมดอายุใน: 15 นาที`);
  console.log(`========================================\n`);

  try {
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[Orange Music] รหัสยืนยันตั้งรหัสผ่านใหม่: ${otp}`,
      text: `รหัสยืนยันสำหรับตั้งรหัสผ่านใหม่ของคุณคือ: ${otp} (มีอายุ 15 นาที)`,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL SENT] ส่งอีเมลไปยัง ${toEmail} สำเร็จแล้ว (MessageID: ${info?.messageId})`);

    if (info && info.messageId && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 ดูอีเมลทดสอบ Ethereal ได้ที่: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.error('Send mail error:', err);
    // แม้ SMTP ภายนอกจะส่งไม่ผ่าน แต่ใน dev ให้ยังทำงานต่อได้
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
