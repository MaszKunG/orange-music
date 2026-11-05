const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🔄 กำลังเตรียมโครงสร้างฐานข้อมูล Orange Music...');

  // 1. สร้างตารางทั้งหมด (รวมฟิลด์สถานะการอนุมัติ)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'uploader', 'user')) NOT NULL DEFAULT 'user',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      category_id INTEGER,
      uploader_id INTEGER,
      description TEXT,
      lyrics TEXT,
      audio_path TEXT NOT NULL,
      cover_path TEXT,
      play_count INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      reject_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (playlist_id, song_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, song_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      song_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );
  `);

  // ตรวจสอบ Auto-migration เผื่อกรณีฐานข้อมูลเดิมยังไม่มีคอลัมน์ status
  try {
    const tableInfo = await db.all(`PRAGMA table_info(songs)`);
    const columnNames = tableInfo.map(c => c.name);

    if (!columnNames.includes('status')) {
      await db.run(`ALTER TABLE songs ADD COLUMN status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending'`);
      console.log('➕ Migration: เพิ่มคอลัมน์ status ในตาราง songs สำเร็จ');
    }
    if (!columnNames.includes('reviewed_by')) {
      await db.run(`ALTER TABLE songs ADD COLUMN reviewed_by INTEGER`);
      console.log('➕ Migration: เพิ่มคอลัมน์ reviewed_by ในตาราง songs สำเร็จ');
    }
    if (!columnNames.includes('reviewed_at')) {
      await db.run(`ALTER TABLE songs ADD COLUMN reviewed_at DATETIME`);
      console.log('➕ Migration: เพิ่มคอลัมน์ reviewed_at ในตาราง songs สำเร็จ');
    }
    if (!columnNames.includes('reject_reason')) {
      await db.run(`ALTER TABLE songs ADD COLUMN reject_reason TEXT`);
      console.log('➕ Migration: เพิ่มคอลัมน์ reject_reason ในตาราง songs สำเร็จ');
    }
  } catch (migErr) {
    console.warn('Migration note:', migErr.message);
  }

  console.log('✅ ตารางฐานข้อมูลพร้อมใช้งาน');

  // ซ่อมแซมรูปภาพปกที่เป็น Dead Links จาก Unsplash ให้อัปเดตเป็นภาพที่ใช้งานได้ถาวร
  try {
    await db.run(`
      UPDATE songs 
      SET cover_path = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'
      WHERE cover_path LIKE '%photo-1507842229451-7f01be7f7b2a%'
    `);
    await db.run(`
      UPDATE songs 
      SET cover_path = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=80'
      WHERE cover_path LIKE '%photo-1520523839898-507127053c37%'
    `);
  } catch (repairErr) {
    console.warn('Image repair note:', repairErr.message);
  }

  // ตรวจสอบว่ามีผู้ใช้แอดมินหรือยัง
  const existingAdmin = await db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (!existingAdmin) {
    console.log('🌱 กำลังเริ่มต้น Seed ข้อมูลระบบ...');

    // 2. สร้าง User Seed (Admin, Uploader, User)
    const adminPassword = await bcrypt.hash('admin1234', 10);
    const uploaderPassword = await bcrypt.hash('uploader1234', 10);
    const userPassword = await bcrypt.hash('user1234', 10);

    const adminResult = await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, avatar)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `, ['admin', 'admin@orange.music', adminPassword, 'ผู้ดูแลระบบ ส้มมิวสิค', 'https://api.dicebear.com/7.x/bottts/svg?seed=orangeAdmin']);

    const uploaderResult = await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, avatar)
      VALUES (?, ?, ?, ?, 'uploader', ?)
    `, ['uploader_som', 'uploader@orange.music', uploaderPassword, 'ส้มจี๊ด สตูดิโอ (ศิลปินอิสระ)', 'https://api.dicebear.com/7.x/bottts/svg?seed=orangeUploader']);

    const userResult = await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, avatar)
      VALUES (?, ?, ?, ?, 'user', ?)
    `, ['student_som', 'student@orange.music', userPassword, 'น้องส้ม นิสิตจุฬาฯ', 'https://api.dicebear.com/7.x/bottts/svg?seed=orangeStudent']);

    // 3. สร้างหมวดหมู่ตัวอย่าง
    const categories = [
      { name: 'เพลงสำหรับอ่านหนังสือ (Study & Focus)', description: 'ดนตรีโทนสบาย ผ่อนคลาย เพิ่มสมาธิในการอ่านหนังสือและทำงาน' },
      { name: 'อะคูสติก & โฟล์ก (Acoustic & Folk)', description: 'เสียงกีตาร์โปร่งนุ่มละมุน เมโลดี้อบอุ่นหัวใจ' },
      { name: 'ป๊อปฟังสบาย (Pop Chill)', description: 'เพลงป๊อปจังหวะกำลังดี สดชื่นเติมพลังระหว่างวัน' },
      { name: 'เปียโน & บรรเลง (Instrumental Piano)', description: 'เสียงเปียโนคลาสสิกและร่วมสมัย ช่วยปลอบประโลมจิตใจ' },
      { name: 'อินดี้ลอยละล่อง (Indie Lo-Fi)', description: 'บีต Lo-fi สไตล์อินดี้สำหรับช่วงเวลาพักผ่อนและช่วงดึก' },
      { name: 'พลังบวก & ไฟลุก (Rock & Energy)', description: 'จังหวะร็อกคึกคัก ปลุกพลังก่อนเข้าห้องสอบหรือทำกิจกรรม' }
    ];

    const categoryIds = [];
    for (const cat of categories) {
      const res = await db.run(`INSERT INTO categories (name, description) VALUES (?, ?)`, [cat.name, cat.description]);
      categoryIds.push(res.id);
    }

    // 4. สร้างตัวอย่างไฟล์เสียง minimal wav
    const audioDir = path.resolve(__dirname, '../../uploads/audio');
    const coversDir = path.resolve(__dirname, '../../uploads/covers');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

    function generateBeepWav(filename, frequency = 440, durationSeconds = 5) {
      const filePath = path.join(audioDir, filename);
      if (fs.existsSync(filePath)) return;

      const sampleRate = 8000;
      const numSamples = sampleRate * durationSeconds;
      const buffer = Buffer.alloc(44 + numSamples);

      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + numSamples, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate, 28);
      buffer.writeUInt16LE(1, 32);
      buffer.writeUInt16LE(8, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples, 40);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 + 
                       Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.2;
        const byteVal = Math.floor((sample + 1) * 127.5);
        buffer.writeUInt8(byteVal, 44 + i);
      }

      fs.writeFileSync(filePath, buffer);
    }

    generateBeepWav('orange_acoustic.wav', 440, 8);
    generateBeepWav('orange_lofi.wav', 330, 8);
    generateBeepWav('orange_piano.wav', 523, 8);
    generateBeepWav('orange_pop.wav', 392, 8);
    generateBeepWav('orange_study.wav', 261, 8);
    generateBeepWav('orange_energy.wav', 587, 8);
    generateBeepWav('orange_demo_pending.wav', 490, 8);

    // 5. Seed เพลงตัวอย่าง ครบทั้ง 3 สถานะ (approved, pending, rejected)
    const sampleSongs = [
      {
        title: 'ส้มจี๊ดในใจเธอ',
        artist: 'ส้มจี๊ด & The Orange Band',
        category_id: categoryIds[2], // Pop Chill
        uploader_id: uploaderResult.id,
        description: 'เพลงป๊อปสดใส เมโลดี้ติดหู ถ่ายทอดความรู้สึกหวานอมเปรี้ยวเหมือนส้มสดใหม่ในฤดูร้อน',
        lyrics: `(Verse 1)\nมองดูท้องฟ้าสดใส แดดส่องประกายสีส้มงดงาม\nใจดวงนี้อยากจะถาม เธอคิดถึงกันบ้างหรือเปล่า\n\n(Chorus)\nส้มจี๊ดในใจเธอ สดใสเหมือนเสียงดนตรี\nทุกวินาทีที่มีเธออยู่ข้างกาย`,
        audio_path: '/uploads/audio/orange_pop.wav',
        cover_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
        play_count: 142,
        status: 'approved',
        reviewed_by: adminResult.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: null
      },
      {
        title: 'อ่านหนังสือยามบ่าย (Study Breeze)',
        artist: 'Lo-Fi Som Cafe',
        category_id: categoryIds[0], // Study & Focus
        uploader_id: uploaderResult.id,
        description: 'บีตผ่อนคลายเบาๆ เหมาะสำหรับเปิดคลอระหว่างอ่านหนังสือสอบหรือทำงานวิจัย',
        lyrics: `(Instrumental Track)\nดนตรีบรรเลงเพื่อเสริมสร้างสมาธิและความจำ`,
        audio_path: '/uploads/audio/orange_study.wav',
        cover_path: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
        play_count: 310,
        status: 'approved',
        reviewed_by: adminResult.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: null
      },
      {
        title: 'แสงแดดยามเช้าและกีตาร์ตัวโปรด',
        artist: 'เอก อะคูสติก',
        category_id: categoryIds[1], // Acoustic & Folk
        uploader_id: uploaderResult.id,
        description: 'เสียงกีตาร์โปร่งใส เมโลดี้นุ่มละมุน ชวนให้ดื่มด่ำกับช่วงเวลาอันเงียบสงบในมหาวิทยาลัย',
        lyrics: `(Verse 1)\nสายลมพัดผ่านชายหน้าต่าง กลิ่นกาแฟกรุ่นยามเช้า\nหยิบกีตาร์ตัวเก่ามาบรรเลงเพลงที่เราเคยชอบฟัง`,
        audio_path: '/uploads/audio/orange_acoustic.wav',
        cover_path: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&auto=format&fit=crop&q=80',
        play_count: 225,
        status: 'approved',
        reviewed_by: adminResult.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: null
      },
      {
        title: 'เปียโนใต้ร่มไม้ (Piano under the Tree)',
        artist: 'อาจารย์เมธี คีตกานต์',
        category_id: categoryIds[3], // Instrumental Piano
        uploader_id: uploaderResult.id,
        description: 'ผลงานประพันธ์เปียโนคลาสสิกร่วมสมัย โดยคณาจารย์ภาควิชาดนตรีศึกษา',
        lyrics: `(ดนตรีบรรเลงเปียโนเดี่ยว)`,
        audio_path: '/uploads/audio/orange_piano.wav',
        cover_path: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=80',
        play_count: 180,
        status: 'approved',
        reviewed_by: adminResult.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: null
      },
      {
        title: 'ไฟลุกก่อนสอบไฟนอล (Exam Motivation)',
        artist: 'The Finalists Band',
        category_id: categoryIds[5], // Rock & Energy
        uploader_id: uploaderResult.id,
        description: 'เพลงร็อกจังหวะเร็ว ปลุกใจให้สู้สุดความสามารถ เพิ่งส่งเข้ามาใหม่',
        lyrics: `(Chorus)\nลุยเข้าไป อย่าได้ถอย!\nคืนนี้หนังสือเป็นกอง แต่ใจเราเต็มร้อย!`,
        audio_path: '/uploads/audio/orange_energy.wav',
        cover_path: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80',
        play_count: 0,
        status: 'pending', // สถานะ: รออนุมัติ
        reviewed_by: null,
        reviewed_at: null,
        reject_reason: null
      },
      {
        title: 'ทำนองแห่งความฝันยามค่ำคืน',
        artist: 'Orange Dreamer',
        category_id: categoryIds[4], // Indie Lo-Fi
        uploader_id: uploaderResult.id,
        description: 'บีต Lo-Fi ส่งประกวดผลงานดนตรีนักศึกษา รอแอดมินตรวจสอบ',
        lyrics: `(ดนตรีบรรเลงผ่อนคลาย)`,
        audio_path: '/uploads/audio/orange_demo_pending.wav',
        cover_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
        play_count: 0,
        status: 'pending', // สถานะ: รออนุมัติ
        reviewed_by: null,
        reviewed_at: null,
        reject_reason: null
      },
      {
        title: 'ฝนพรำที่ป้ายรถเมล์หน้ามอ',
        artist: 'Midnight Orange',
        category_id: categoryIds[4], // Indie Lo-Fi
        uploader_id: uploaderResult.id,
        description: 'บทเพลงอินดี้ชวนเหงา มีสัญญาณเสียงแทรกช่วงท้าย',
        lyrics: `(Verse)\nหยดน้ำฝนไหลผ่านกระจก เสียงเพลงเบาๆ คลอในหูฟัง...`,
        audio_path: '/uploads/audio/orange_lofi.wav',
        cover_path: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
        play_count: 0,
        status: 'rejected', // สถานะ: ไม่อนุมัติ
        reviewed_by: adminResult.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: 'พบเสียงรบกวน (Audio Noise/Clipping) ในช่วงนาทีสุดท้ายของเพลง กรุณา Export ไฟล์เสียงใหม่ที่มีคุณภาพคมชัด แล้วกดส่งตรวจอีกครั้ง'
      }
    ];

    const songIds = [];
    for (const song of sampleSongs) {
      const res = await db.run(`
        INSERT INTO songs (title, artist, category_id, uploader_id, description, lyrics, audio_path, cover_path, play_count, status, reviewed_by, reviewed_at, reject_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        song.title, song.artist, song.category_id, song.uploader_id, song.description,
        song.lyrics, song.audio_path, song.cover_path, song.play_count,
        song.status, song.reviewed_by, song.reviewed_at, song.reject_reason
      ]);
      songIds.push(res.id);
    }

    // 6. Seed Playlist สำหรับ user (เฉพาะเพลงที่ approved)
    const playlistRes = await db.run(`
      INSERT INTO playlists (user_id, name)
      VALUES (?, ?)
    `, [userResult.id, 'เพลย์ลิสต์อ่านหนังสือเตรียมสอบ Midterm 🍊']);

    await db.run(`INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)`, [playlistRes.id, songIds[1]]);
    await db.run(`INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)`, [playlistRes.id, songIds[3]]);

    // 7. Seed Like เพลงสำหรับ user
    await db.run(`INSERT INTO likes (user_id, song_id) VALUES (?, ?)`, [userResult.id, songIds[0]]);
    await db.run(`INSERT INTO likes (user_id, song_id) VALUES (?, ?)`, [userResult.id, songIds[1]]);

    // 8. Seed Notification แจ้งเตือนผู้อัปโหลด
    await db.run(`
      INSERT INTO notifications (user_id, title, message, song_id, is_read)
      VALUES (?, ?, ?, ?, 0)
    `, [
      uploaderResult.id,
      'ผลการตรวจสอบเพลง: ฝนพรำที่ป้ายรถเมล์หน้ามอ',
      'เพลงของคุณไม่ผ่านการอนุมัติเนื่องจาก: พบเสียงรบกวน (Audio Noise/Clipping) ในช่วงนาทีสุดท้ายของเพลง คุณสามารถแก้ไขแล้วส่งตรวจอีกครั้งได้',
      songIds[6]
    ]);

    await db.run(`
      INSERT INTO notifications (user_id, title, message, song_id, is_read)
      VALUES (?, ?, ?, ?, 1)
    `, [
      uploaderResult.id,
      'ยินดีด้วย! เพลงของคุณได้รับการอนุมัติแล้ว',
      'บทเพลง "ส้มจี๊ดในใจเธอ" ผ่านการตรวจสอบจากแอดมินและเผยแพร่สู่ผู้ฟังเรียบร้อยแล้ว',
      songIds[0]
    ]);

    console.log('🎉 Seed ข้อมูลระบบสำเร็จเรียบร้อย พร้อมเพลงทั้ง 3 สถานะ (approved, pending, rejected)!');
  } else {
    // กรณีมีข้อมูลเดิมอยู่แล้ว ให้อัปเดตเพลงเดิมให้มีสถานะ approved, pending, rejected ครบเพื่อการทดสอบ
    try {
      const existingSongs = await db.all(`SELECT id FROM songs ORDER BY id ASC`);
      if (existingSongs.length > 0) {
        // ให้เพลงแรกๆ เป็น approved
        await db.run(`UPDATE songs SET status = 'approved' WHERE status IS NULL OR status = ''`);
        if (existingSongs.length >= 5) {
          // ตั้งเพลงที่ 5 เป็น pending
          await db.run(`UPDATE songs SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, reject_reason = NULL WHERE id = ?`, [existingSongs[4].id]);
        }
        if (existingSongs.length >= 6) {
          // ตั้งเพลงที่ 6 เป็น rejected
          await db.run(`UPDATE songs SET status = 'rejected', reject_reason = 'พบเสียงรบกวน (Audio Noise/Clipping) ในช่วงนาทีสุดท้ายของเพลง กรุณา Export ไฟล์เสียงใหม่ที่มีคุณภาพคมชัด แล้วกดส่งตรวจอีกครั้ง' WHERE id = ?`, [existingSongs[5].id]);
        }
      }
    } catch (e) {
      console.warn('Sync status note:', e.message);
    }
  }
}

module.exports = { initDatabase };
