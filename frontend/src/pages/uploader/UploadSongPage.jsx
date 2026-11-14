import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, Music, Image as ImageIcon, ArrowLeft, CheckCircle2, AlertCircle, Link2, Loader2, Search } from 'lucide-react';
import YouTubeIcon from '../../components/common/YouTubeIcon';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function UploadSongPage() {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'youtube'
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // YouTube-specific states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetchingYtInfo, setFetchingYtInfo] = useState(false);
  const [ytInfo, setYtInfo] = useState(null); // { videoId, title, artist, thumbnail }

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.categories);
        if (res.categories.length > 0) {
          setCategoryId(res.categories[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset form when switching mode
  const handleModeSwitch = (mode) => {
    setUploadMode(mode);
    setValidationError('');
    if (mode === 'youtube') {
      setAudioFile(null);
    } else {
      setYoutubeUrl('');
      setYtInfo(null);
    }
  };

  const handleFetchYouTubeInfo = async () => {
    if (!youtubeUrl.trim()) {
      setValidationError('กรุณาวางลิงก์ YouTube');
      return;
    }

    try {
      setFetchingYtInfo(true);
      setValidationError('');
      const res = await api.get(`/songs/youtube-info?url=${encodeURIComponent(youtubeUrl.trim())}`);
      if (res.success) {
        setYtInfo(res);
        setTitle(res.title || '');
        setArtist(res.artist || '');
        setCoverPreview(res.thumbnail);
        showToast('ดึงข้อมูลจาก YouTube สำเร็จ!', 'success');
      }
    } catch (err) {
      setValidationError(err.message || 'ไม่สามารถดึงข้อมูลจากลิงก์ YouTube ได้ — ตรวจสอบ URL อีกครั้ง');
      setYtInfo(null);
    } finally {
      setFetchingYtInfo(false);
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setValidationError('ไฟล์เสียงมีขนาดเกิน 20MB กรุณาเลือกไฟล์ที่เล็กลง');
        setAudioFile(null);
        return;
      }
      setAudioFile(file);
      setValidationError('');
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationError('รูปปกมีขนาดเกิน 2MB กรุณาเลือกไฟล์ที่เล็กลง');
        setCoverFile(null);
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim() || !artist.trim()) {
      setValidationError('กรุณาระบุชื่อเพลงและชื่อศิลปิน');
      return;
    }

    if (uploadMode === 'file') {
      if (!audioFile) {
        setValidationError('กรุณาเลือกไฟล์เสียงบทเพลง (.mp3, .wav, .m4a)');
        return;
      }
    } else {
      // YouTube mode
      if (!ytInfo || !ytInfo.videoId) {
        setValidationError('กรุณาวางลิงก์ YouTube และกดดึงข้อมูลก่อน');
        return;
      }
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      if (categoryId) formData.append('category_id', categoryId);
      if (description.trim()) formData.append('description', description.trim());
      if (lyrics.trim()) formData.append('lyrics', lyrics.trim());

      if (uploadMode === 'file') {
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
      } else {
        // YouTube mode — send youtube-specific fields
        formData.append('source_type', 'youtube');
        formData.append('youtube_url', youtubeUrl.trim());
        formData.append('youtube_id', ytInfo.videoId);
        formData.append('cover_path', ytInfo.thumbnail || '');
        // If user also uploaded a custom cover, include it
        if (coverFile) formData.append('cover', coverFile);
      }

      const res = await api.post('/songs', formData);
      if (res.success) {
        showToast(
          uploadMode === 'youtube'
            ? 'เพิ่มเพลงจาก YouTube สำเร็จเรียบร้อย!'
            : 'อัปโหลดผลงานเพลงสำเร็จเรียบร้อย!',
          'success'
        );
        navigate('/uploader/my-songs');
      }
    } catch (err) {
      setValidationError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดเพลง');
      showToast(err.message || 'อัปโหลดไม่สำเร็จ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4">
      <Link
        to="/uploader/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs text-text-sub hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับไปแดชบอร์ด</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
          <UploadCloud className="w-7 h-7 text-orange-500" />
          <span>อัปโหลดบทเพลงใหม่</span>
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">
          กรอกรายละเอียดและอัปโหลดไฟล์เพลงเพื่อแชร์ให้กับทุกคนใน Orange Music
        </p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 sm:p-8 shadow-dialog">
        {/* แท็บสลับโหมด: อัปโหลดไฟล์ | วางลิงก์ YouTube */}
        <div className="flex rounded-2xl bg-dark-card border border-dark-border p-1 mb-6">
          <button
            type="button"
            onClick={() => handleModeSwitch('file')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              uploadMode === 'file'
                ? 'bg-orange-500 text-black shadow-glow-orange-sm'
                : 'text-text-sub hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>อัปโหลดไฟล์เพลง</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('youtube')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              uploadMode === 'youtube'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-text-sub hover:text-white'
            }`}
          >
            <YouTubeIcon className="w-4 h-4" />
            <span>วางลิงก์ YouTube</span>
          </button>
        </div>

        {validationError && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL Input (เฉพาะโหมด YouTube) */}
          {uploadMode === 'youtube' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-red-400 uppercase flex items-center space-x-1.5">
                  <YouTubeIcon className="w-4 h-4" />
                  <span>วางลิงก์ YouTube ที่นี่</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setYtInfo(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                    className="flex-1 bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-red-500 focus:outline-none placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={handleFetchYouTubeInfo}
                    disabled={fetchingYtInfo || !youtubeUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 whitespace-nowrap"
                  >
                    {fetchingYtInfo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{fetchingYtInfo ? 'กำลังดึง...' : 'ดึงข้อมูล'}</span>
                  </button>
                </div>

                {/* YouTube Preview */}
                {ytInfo && (
                  <div className="flex items-center space-x-3 p-3 bg-dark-card rounded-xl border border-dark-borderSubtle animate-fade-in">
                    <img
                      src={ytInfo.thumbnail}
                      alt={ytInfo.title}
                      className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{ytInfo.title}</p>
                      <p className="text-[11px] text-text-sub truncate">{ytInfo.artist}</p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] text-green-400 font-medium">พร้อมเพิ่มเพลง</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ข้อมูลพื้นฐาน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                ชื่อบทเพลง <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น อ่านหนังสือยามบ่าย"
                required
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                ชื่อศิลปิน / ผู้ประพันธ์ <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="เช่น ส้มแบนด์ หรือ วงดนตรีคณะ"
                required
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* หมวดหมู่เพลง */}
          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
              หมวดหมู่บทเพลง
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* ส่วนอัปโหลดไฟล์เสียงและรูปปก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* อัปโหลดไฟล์เสียง (เฉพาะโหมดไฟล์) */}
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase">
                  ไฟล์เสียงเพลง (.mp3, .wav, .m4a สูงสุด 20MB) <span className="text-orange-500">*</span>
                </label>
                <label
                  htmlFor="audio-input"
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    audioFile
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-dark-border hover:border-orange-500/60 bg-dark-card'
                  }`}
                >
                  <Music className="w-8 h-8 text-orange-500 mb-2" />
                  <span className="text-xs font-bold text-white text-center truncate max-w-full px-2">
                    {audioFile ? audioFile.name : 'คลิกเพื่อเลือกไฟล์เสียง'}
                  </span>
                  <span className="text-[10px] text-text-muted mt-1">
                    {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : 'รองรับ .mp3, .wav, .m4a'}
                  </span>
                </label>
                <input
                  id="audio-input"
                  type="file"
                  accept=".mp3,audio/mpeg,audio/wav,audio/x-wav,.wav,.m4a,audio/x-m4a,audio/mp4"
                  onChange={handleAudioChange}
                  className="hidden"
                />
              </div>
            )}

            {/* อัปโหลดรูปปก */}
            <div className={`space-y-2 ${uploadMode === 'youtube' ? 'sm:col-span-2' : ''}`}>
              <label className="block text-xs font-bold text-text-sub uppercase">
                รูปหน้าปกเพลง (.jpg, .png สูงสุด 2MB)
                {uploadMode === 'youtube' && (
                  <span className="text-text-muted font-normal ml-1">— ไม่ต้องใส่ก็ได้ (ใช้รูปจาก YouTube)</span>
                )}
              </label>
              <label
                htmlFor="cover-input"
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
                  coverFile || (uploadMode === 'youtube' && ytInfo?.thumbnail)
                    ? 'border-orange-500 bg-dark-card'
                    : 'border-dark-border hover:border-orange-500/60 bg-dark-card'
                }`}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-text-sub mb-2" />
                    <span className="text-xs font-bold text-white">คลิกเพื่อเลือกรูปหน้าปก</span>
                    <span className="text-[10px] text-text-muted mt-1">แนะนำขนาดสี่เหลี่ยมจัตุรัส 500x500</span>
                  </>
                )}
              </label>
              <input
                id="cover-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>
          </div>

          {/* คำอธิบายเพลง */}
          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
              คำอธิบายบทเพลง (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="แรงบันดาลใจ หรือคำแนะนำสำหรับผู้ฟัง..."
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* เนื้อร้อง */}
          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
              เนื้อเพลง (Lyrics) - ไม่บังคับ
            </label>
            <textarea
              rows={5}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="ใส่เนื้อร้องของบทเพลงที่นี่..."
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 rounded-full font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 ${
              uploadMode === 'youtube'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-orange-500 hover:bg-orange-400 text-black'
            }`}
          >
            {uploadMode === 'youtube' ? (
              <YouTubeIcon className="w-5 h-5" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            <span>
              {submitting
                ? 'กำลังเพิ่มบทเพลง...'
                : uploadMode === 'youtube'
                ? 'เพิ่มเพลงจาก YouTube สู่ Orange Music'
                : 'เผยแพร่บทเพลงสู่ Orange Music'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
