const nodemailer = require('nodemailer');

let transporter = null;

// สร้างหรือดึง Transporter สำหรับส่งอีเมล (โหมด SMTP)
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : '';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
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
    console.log(`📧 ระบบอีเมล: เตรียม SMTP Server ที่ ${host}:${port}`);
  } else {
    console.log('📧 ระบบอีเมล: ยังไม่ได้ระบุ SMTP credentials ใน .env');
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
      transporter = {
        sendMail: async () => ({ messageId: 'mock-id', mock: true })
      };
    }
  }

  return transporter;
}

// ส่งผ่าน Brevo REST API (HTTPS Port 443 - ไม่โดน Render Free บล็อก 100%)
async function sendViaBrevo(toEmail, username, otp, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY.trim();
  const senderEmail = process.env.SMTP_USER || process.env.EMAIL_FROM || 'orangemusicreal@gmail.com';
  const cleanSender = senderEmail.includes('<') ? senderEmail.match(/<([^>]+)>/)?.[1] || senderEmail : senderEmail;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Orange Music', email: cleanSender },
      to: [{ email: toEmail, name: username || 'User' }],
      subject: `[Orange Music] รหัสยืนยันตั้งรหัสผ่านใหม่: ${otp}`,
      htmlContent: htmlContent
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Brevo error ${res.status}`);
  }

  console.log(`✅ [BREVO API SENT] ส่งอีเมลถึง ${toEmail} สำเร็จ! MessageID:`, data.messageId);
  return { success: true, messageId: data.messageId };
}

// ส่งผ่าน Resend REST API (HTTPS Port 443)
async function sendViaResend(toEmail, username, otp, htmlContent) {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const from = process.env.EMAIL_FROM || 'Orange Music <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: `[Orange Music] รหัสยืนยันตั้งรหัสผ่านใหม่: ${otp}`,
      html: htmlContent
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend error ${res.status}`);
  }

  console.log(`✅ [RESEND API SENT] ส่งอีเมลถึง ${toEmail} สำเร็จ! MessageID:`, data.id);
  return { success: true, messageId: data.id };
}

/**
 * ส่งรหัสยืนยัน (OTP) สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของผู้ใช้
 */
async function sendPasswordResetEmail(toEmail, username, otp) {
  const fromAddress = process.env.EMAIL_FROM || '"Orange Music 🍊" <orangemusicreal@gmail.com>';

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

  // 1. ลองส่งผ่าน Brevo REST API ก่อน (ถ้ามีการตั้งค่า BREVO_API_KEY)
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo(toEmail, username, otp, htmlContent);
    } catch (e) {
      console.error('Brevo API send failed, fallback to others:', e.message);
    }
  }

  // 2. ลองส่งผ่าน Resend REST API (ถ้ามีการตั้งค่า RESEND_API_KEY)
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend(toEmail, username, otp, htmlContent);
    } catch (e) {
      console.error('Resend API send failed, fallback to others:', e.message);
    }
  }

  // 3. Fallback: ส่งผ่าน Nodemailer SMTP (กรณีรันบน Local หรือเครื่องที่ไม่ถูกบล็อกพอร์ต)
  try {
    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[Orange Music] รหัสยืนยันตั้งรหัสผ่านใหม่: ${otp}`,
      text: `รหัสยืนยันสำหรับตั้งรหัสผ่านใหม่ของคุณคือ: ${otp} (มีอายุ 15 นาที)`,
      html: htmlContent,
    });

    console.log(`✅ [SMTP SENT] ส่งอีเมลไปยัง ${toEmail} สำเร็จแล้ว (MessageID: ${info?.messageId})`);
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.error('Send mail error (SMTP):', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
