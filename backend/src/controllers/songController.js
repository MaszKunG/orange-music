const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { saveUploadedFile } = require('../services/storageService');

// ดึงรายการเพลงทั้งหมด (พร้อมระบบ Filter, ค้นหา, เรียงลำดับ, และการตรวจสอบสถานะ Approval)
async function getAllSongs(req, res) {
  try {
    const { search, category_id, sort, uploader_id, status, limit = 50, offset = 0 } = req.query;
    const currentUser = req.user || null;
    const currentUserId = currentUser ? currentUser.id : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    let query = `
      SELECT 
        s.id, s.title, s.artist, s.category_id, s.uploader_id, s.description, 
        s.lyrics, s.audio_path, s.cover_path, s.play_count, s.status, s.reviewed_by, 
        s.reviewed_at, s.reject_reason, s.created_at,
        c.name AS category_name,
        u.full_name AS uploader_name,
        (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS like_count,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE song_id = s.id AND user_id = ${parseInt(currentUserId)}) > 0` : '0'} AS is_liked
      FROM songs s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.uploader_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // กฎการแสดงผลตามสิทธิ์ (Security & Song Approval Rule)
    // 1) ถ้าเป็น Admin: สามารถดูได้ทุกสถานะ หรือกรองตาม status query
    // 2) ถ้าเป็นเจ้าของเพลง (uploader_id ตรงกับ user ที่ล็อกอิน): สามารถดูเพลงของตนเองได้ทุกสถานะ
    // 3) กรณีบุคคลทั่วไป / ผู้ใช้ทั่วไป: บังคับดูได้เฉพาะเพลง status = 'approved' เท่านั้น!
    const isOwnerViewingOwnSongs = uploader_id && currentUserId && (parseInt(uploader_id) === currentUserId);

    if (isAdmin) {
      if (status) {
        query += ` AND s.status = ?`;
        params.push(status);
      }
    } else if (isOwnerViewingOwnSongs) {
      query += ` AND s.uploader_id = ?`;
      params.push(currentUserId);
      if (status) {
        query += ` AND s.status = ?`;
        params.push(status);
      }
    } else {
      // ผู้ใช้ทั่วไปและแขก: ดูได้เฉพาะ approved เท่านั้น
      query += ` AND s.status = 'approved'`;
    }

    if (search) {
      query += ` AND (s.title LIKE ? OR s.artist LIKE ? OR s.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category_id) {
      query += ` AND s.category_id = ?`;
      params.push(category_id);
    }

    if (uploader_id && !isOwnerViewingOwnSongs) {
      query += ` AND s.uploader_id = ?`;
      params.push(uploader_id);
    }

    if (sort === 'popular') {
      query += ` ORDER BY s.play_count DESC, s.created_at DESC`;
    } else if (sort === 'title') {
      query += ` ORDER BY s.title ASC`;
    } else {
      // Default: newest
      query += ` ORDER BY s.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const songs = await db.all(query, params);
    return res.json({ success: true, count: songs.length, songs });
  } catch (err) {
    console.error('Get all songs error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดรายการเพลง' });
  }
}

// ดึงรายละเอียดเพลงเดี่ยว และเพิ่มยอดการฟัง (Play count)
async function getSongById(req, res) {
  try {
    const songId = req.params.id;
    const currentUser = req.user || null;
    const currentUserId = currentUser ? currentUser.id : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    const song = await db.get(`
      SELECT 
        s.*, 
        c.name AS category_name,
        u.full_name AS uploader_name,
        (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS like_count,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE song_id = s.id AND user_id = ${parseInt(currentUserId)}) > 0` : '0'} AS is_liked
      FROM songs s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.uploader_id = u.id
      WHERE s.id = ?
    `, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการ' });
    }

    // กฎความปลอดภัย: ถ้าเพลงยังไม่อนุมัติ (pending หรือ rejected)
    // อนุญาตให้เฉพาะ Admin หรือเจ้าของเพลงเท่านั้นที่เข้าดูได้
    if (song.status !== 'approved' && !isAdmin && song.uploader_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'เพลงนี้อยู่ระหว่างรอการตรวจสอบจากผู้ดูแลระบบ หรือยังไม่ได้รับอนุมัติให้เผยแพร่'
      });
    }

    // เพิ่มยอดฟังทีละ 1 (เฉพาะเพลงที่ approved แล้ว)
    if (song.status === 'approved') {
      await db.run(`UPDATE songs SET play_count = play_count + 1 WHERE id = ?`, [songId]);
      song.play_count += 1;
    }

    return res.json({ success: true, song });
  } catch (err) {
    console.error('Get song by id error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเพลง' });
  }
}

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ดึงข้อมูลเพลงและหน้าปกจาก YouTube oEmbed อัตโนมัติ (ไม่ต้องใช้ API Key)
async function getYouTubeInfo(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ URL ของ YouTube' });
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'รูปแบบลิงก์ YouTube ไม่ถูกต้อง (ตัวอย่าง: https://www.youtube.com/watch?v=... หรือ https://youtu.be/...)' });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      return res.status(404).json({ success: false, message: 'ไม่พบวิดีโอ YouTube นี้ หรือวิดีโอถูกตั้งค่าเป็นส่วนตัว' });
    }

    const data = await response.json();
    let rawTitle = data.title || '';
    let artist = data.author_name || '';
    let title = rawTitle;

    // ถ้าชื่อคลิปมีรูปแบบ "Artist - Title" หรือ "Artist : Title"
    if (rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    } else if (rawTitle.includes(' : ')) {
      const parts = rawTitle.split(' : ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' : ').trim();
    }

    // ตัดคำว่า [Official MV], (Official Audio) ออกเพื่อให้ชื่อเพลงสะอาดตา
    title = title
      .replace(/\[.*?(official|mv|audio|video|lyric|mv).*?\]/gi, '')
      .replace(/\(.*?(official|mv|audio|video|lyric|mv).*?\)/gi, '')
      .trim();

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return res.json({
      success: true,
      videoId,
      title: title || rawTitle,
      artist: artist || data.author_name,
      thumbnail,
      rawTitle
    });
  } catch (err) {
    console.error('Fetch YouTube info error:', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลจาก YouTube ได้' });
  }
}

// อัปโหลดเพลงใหม่ (ผู้อัปโหลด -> pending, แอดมิน -> approved อัตโนมัติ)
// รองรับทั้งไฟล์เพลงในเครื่อง และลิงก์จาก YouTube
async function uploadSong(req, res) {
  try {
    const { title, artist, category_id, description, lyrics, youtube_url, youtube_id, source_type } = req.body;

    const ytId = extractYouTubeVideoId(youtube_url || youtube_id);
    const isYouTube = source_type === 'youtube' || Boolean(ytId);

    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อเพลงและชื่อศิลปิน' });
    }

    const hasAudioFile = req.files && req.files.audio && req.files.audio.length > 0;
    if (!isYouTube && !hasAudioFile) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดไฟล์เสียง หรือระบุลิงก์ YouTube' });
    }

    let audio_path = '';
    let finalSourceType = 'file';
    let finalYoutubeId = null;

    if (isYouTube && ytId) {
      finalSourceType = 'youtube';
      finalYoutubeId = ytId;
      audio_path = `youtube:${ytId}`;
    } else if (hasAudioFile) {
      const audioFile = req.files.audio[0];
      audio_path = await saveUploadedFile(audioFile, 'audio');
    }

    let cover_path = null;
    if (req.files && req.files.cover && req.files.cover.length > 0) {
      cover_path = await saveUploadedFile(req.files.cover[0], 'covers');
    } else if (req.body.cover_path) {
      cover_path = req.body.cover_path;
    } else if (isYouTube && finalYoutubeId) {
      cover_path = `https://i.ytimg.com/vi/${finalYoutubeId}/hqdefault.jpg`;
    } else {
      cover_path = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
    }

    // กำหนดสถานะ: ถ้าแอดมินอัปโหลดเองให้อนุมัติอัตโนมัติ นอกนั้นเป็น pending
    const isAdmin = req.user.role === 'admin';
    const initialStatus = isAdmin ? 'approved' : 'pending';
    const reviewedBy = isAdmin ? req.user.id : null;
    const reviewedAt = isAdmin ? new Date().toISOString() : null;

    const result = await db.run(`
      INSERT INTO songs (
        title, artist, category_id, uploader_id, description, lyrics,
        audio_path, cover_path, play_count, status, reviewed_by, reviewed_at,
        reject_reason, youtube_id, source_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NULL, ?, ?)
    `, [
      title.trim(),
      artist.trim(),
      category_id ? parseInt(category_id) : null,
      req.user.id,
      description ? description.trim() : null,
      lyrics ? lyrics.trim() : null,
      audio_path,
      cover_path,
      initialStatus,
      reviewedBy,
      reviewedAt,
      finalYoutubeId,
      finalSourceType
    ]);

    // บันทึกไฟล์เสียงลงฐานข้อมูล Turso เพื่อป้องกันไฟล์หายเมื่อ Render รีสตาร์ท (เฉพาะไฟล์ในเครื่อง)
    if (!isYouTube && hasAudioFile) {
      const audioFile = req.files.audio[0];
      if (fs.existsSync(audioFile.path)) {
        try {
          const audioBuffer = fs.readFileSync(audioFile.path);
          await db.run(
            `INSERT OR REPLACE INTO song_audio (song_id, data, mime) VALUES (?, ?, ?)`,
            [result.id, audioBuffer, audioFile.mimetype || 'audio/mpeg']
          );
          // กำหนด audio_path ให้สตรีมผ่าน API ถาวร
          await db.run(`UPDATE songs SET audio_path = ? WHERE id = ?`, [`/api/songs/${result.id}/stream`, result.id]);
        } catch (audioErr) {
          console.warn('Audio DB backup note:', audioErr.message);
        }
      }
    }

    const newSong = await db.get(`SELECT * FROM songs WHERE id = ?`, [result.id]);

    return res.status(201).json({
      success: true,
      message: isAdmin 
        ? (isYouTube ? 'นำเข้าเพลงจาก YouTube และอนุมัติเรียบร้อยแล้ว!' : 'อัปโหลดและอนุมัติเพลงเรียบร้อยแล้ว!')
        : (isYouTube ? 'ส่งเพลงจาก YouTube เรียบร้อย กำลังรอผู้ดูแลระบบตรวจสอบ' : 'ส่งเพลงเรียบร้อย กำลังรอผู้ดูแลระบบตรวจสอบ'),
      song: newSong
    });
  } catch (err) {
    console.error('Upload song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดเพลง' });
  }
}

// แก้ไขข้อมูลเพลง (ถ้าผู้อัปโหลดแก้ไขเพลงที่อนุมัติแล้ว ให้สถานะกลับเป็น pending เพื่อตรวจใหม่)
async function updateSong(req, res) {
  try {
    const songId = req.params.id;
    const song = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการแก้ไข' });
    }

    // ตรวจสอบความเป็นเจ้าของเพลง
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && song.uploader_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขเพลงของผู้อื่น' });
    }

    const { title, artist, category_id, description, lyrics } = req.body;

    let updatedCover = song.cover_path;
    if (req.files && req.files.cover && req.files.cover.length > 0) {
      updatedCover = await saveUploadedFile(req.files.cover[0], 'covers');
    }

    let updatedAudio = song.audio_path;
    let audioChanged = false;
    if (req.files && req.files.audio && req.files.audio.length > 0) {
      const aFile = req.files.audio[0];
      if (fs.existsSync(aFile.path)) {
        try {
          const audioBuffer = fs.readFileSync(aFile.path);
          await db.run(
            `INSERT OR REPLACE INTO song_audio (song_id, data, mime) VALUES (?, ?, ?)`,
            [songId, audioBuffer, aFile.mimetype || 'audio/mpeg']
          );
          updatedAudio = `/api/songs/${songId}/stream`;
          audioChanged = true;
        } catch (audioErr) {
          console.warn('Audio update DB note:', audioErr.message);
        }
      }
      if (!audioChanged) {
        updatedAudio = await saveUploadedFile(aFile, 'audio');
        audioChanged = true;
      }
    }

    // ข้อกำหนด 2.6: ถ้าผู้อัปโหลดแก้ไขเพลง ให้สถานะกลับเป็น pending เพื่อตรวจใหม่ (ยกเว้นแอดมินแก้ไข)
    let newStatus = song.status;
    let newRejectReason = song.reject_reason;
    let newReviewedBy = song.reviewed_by;
    let newReviewedAt = song.reviewed_at;

    if (!isAdmin) {
      newStatus = 'pending';
      newRejectReason = null;
      newReviewedBy = null;
      newReviewedAt = null;
    }

    await db.run(`
      UPDATE songs 
      SET title = ?, artist = ?, category_id = ?, description = ?, lyrics = ?, 
          cover_path = ?, audio_path = ?, status = ?, reject_reason = ?, 
          reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `, [
      title ? title.trim() : song.title,
      artist ? artist.trim() : song.artist,
      category_id !== undefined ? (category_id ? parseInt(category_id) : null) : song.category_id,
      description !== undefined ? description : song.description,
      lyrics !== undefined ? lyrics : song.lyrics,
      updatedCover,
      updatedAudio,
      newStatus,
      newRejectReason,
      newReviewedBy,
      newReviewedAt,
      songId
    ]);

    const updated = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    return res.json({
      success: true,
      message: (!isAdmin && song.status === 'approved')
        ? 'บันทึกการแก้ไขแล้ว บทเพลงถูกส่งให้ผู้ดูแลระบบตรวจสอบใหม่อีกครั้ง'
        : 'บันทึกการแก้ไขเพลงสำเร็จ',
      song: updated
    });
  } catch (err) {
    console.error('Update song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขเพลง' });
  }
}

// ผู้อัปโหลดส่งเพลงตรวจอีกครั้ง (Resubmit song)
async function resubmitSong(req, res) {
  try {
    const songId = req.params.id;
    const song = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการ' });
    }

    if (song.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ส่งตรวจเพลงนี้' });
    }

    await db.run(`
      UPDATE songs 
      SET status = 'pending', reject_reason = NULL, reviewed_by = NULL, reviewed_at = NULL 
      WHERE id = ?
    `, [songId]);

    const updated = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    return res.json({
      success: true,
      message: 'ส่งเพลงให้ผู้ดูแลระบบตรวจสอบอีกครั้งเรียบร้อยแล้ว',
      song: updated
    });
  } catch (err) {
    console.error('Resubmit song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งตรวจเพลง' });
  }
}

// ลบเพลง (เจ้าของเพลง หรือ Admin เท่านั้น)
async function deleteSong(req, res) {
  try {
    const songId = req.params.id;
    const song = await db.get(`SELECT * FROM songs WHERE id = ?`, [songId]);

    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลงที่ต้องการลบ' });
    }

    if (req.user.role !== 'admin' && song.uploader_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบเพลงของผู้อื่น' });
    }

    if (song.audio_path && song.audio_path.startsWith('/uploads/')) {
      const fullAudioPath = path.resolve(__dirname, '../../', song.audio_path.replace(/^\//, ''));
      if (fs.existsSync(fullAudioPath)) {
        try { fs.unlinkSync(fullAudioPath); } catch (e) { /* ignore */ }
      }
    }
    if (song.cover_path && song.cover_path.startsWith('/uploads/')) {
      const fullCoverPath = path.resolve(__dirname, '../../', song.cover_path.replace(/^\//, ''));
      if (fs.existsSync(fullCoverPath)) {
        try { fs.unlinkSync(fullCoverPath); } catch (e) { /* ignore */ }
      }
    }

    await db.run(`DELETE FROM songs WHERE id = ?`, [songId]);

    return res.json({
      success: true,
      message: 'ลบเพลงสำเร็จเรียบร้อย'
    });
  } catch (err) {
    console.error('Delete song error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเพลง' });
  }
}

// สตรีมไฟล์เสียง (รองรับ HTTP 206 Range Streaming, Disk Caching, และดึงจากฐานข้อมูล Turso)
async function streamSongAudio(req, res) {
  try {
    const songId = req.params.id;
    const song = await db.get(`SELECT id, audio_path FROM songs WHERE id = ?`, [songId]);
    if (!song) {
      return res.status(404).json({ success: false, message: 'ไม่พบเพลง' });
    }

    const cacheDir = path.resolve(__dirname, '../../uploads/audio');
    if (!fs.existsSync(cacheDir)) {
      try { fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) { /* ignore */ }
    }

    // 1. ตรวจสอบไฟล์บนดิสก์จริง
    if (song.audio_path && song.audio_path.startsWith('/uploads/')) {
      const diskPath = path.resolve(__dirname, '../../', song.audio_path.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) {
        return res.sendFile(diskPath, { acceptRanges: true });
      }
    }

    // ตรวจสอบไฟล์แคชในเครื่อง Render
    const cachedFileMp3 = path.join(cacheDir, `cached_${songId}.mp3`);
    const cachedFileWav = path.join(cacheDir, `cached_${songId}.wav`);
    if (fs.existsSync(cachedFileMp3)) {
      return res.sendFile(cachedFileMp3, { acceptRanges: true });
    }
    if (fs.existsSync(cachedFileWav)) {
      return res.sendFile(cachedFileWav, { acceptRanges: true });
    }

    // 2. ถ้ายังไม่มีบนดิสก์ (เซิร์ฟเวอร์เพิ่งรีสตาร์ท) -> ดึงจาก Turso DB
    const audioRecord = await db.get(`SELECT data, mime FROM song_audio WHERE song_id = ?`, [songId]);
    if (audioRecord && audioRecord.data) {
      const buffer = Buffer.from(audioRecord.data);
      const mimeType = audioRecord.mime || 'audio/mpeg';
      const fileExt = mimeType.includes('wav') ? '.wav' : '.mp3';
      const targetCacheFile = path.join(cacheDir, `cached_${songId}${fileExt}`);

      // เซฟลงดิสก์ Render ในเบื้องหลังเพื่อให้การเล่นครั้งต่อไปและ Seek เร็วระดับเสี้ยววินาที
      try {
        fs.writeFileSync(targetCacheFile, buffer);
        return res.sendFile(targetCacheFile, { acceptRanges: true });
      } catch (writeErr) {
        console.warn('Cache write to disk failed, fallback to memory range streaming:', writeErr.message);
      }

      // Fallback: รองรับ HTTP 206 Partial Content โดยตรงจาก Memory Buffer
      const totalSize = buffer.length;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize) {
          res.setHeader('Content-Range', `bytes */${totalSize}`);
          return res.status(416).send('Requested range not satisfiable');
        }

        const chunkSize = (end - start) + 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.send(buffer.subarray(start, end + 1));
      } else {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', totalSize);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.send(buffer);
      }
    }

    return res.status(404).json({ success: false, message: 'ไม่พบไฟล์เสียง' });
  } catch (err) {
    console.error('Stream audio error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสตรีมเพลง' });
  }
}

module.exports = {
  getAllSongs,
  getSongById,
  uploadSong,
  updateSong,
  resubmitSong,
  deleteSong,
  streamSongAudio,
  getYouTubeInfo
};
