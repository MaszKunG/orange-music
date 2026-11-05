import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  FileText,
  ListMusic,
  Maximize2,
  X
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { api, getFullMediaUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function PersistentPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoop,
    isShuffle,
    playSong,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
    nextSong,
    prevSong,
    updateSongLikeStatus,
    queue
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // ถ้ายังไม่มีเพลงที่เลือกเล่น ให้แสดงแถบต้อนรับแบบย่อ หรือ placeholder
  if (!currentSong) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-dark-surface/95 backdrop-blur-lg border-t border-dark-border px-4 py-3 flex items-center justify-between text-xs text-text-sub">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-dark-card flex items-center justify-center text-orange-500">
            🍊
          </div>
          <div>
            <p className="font-semibold text-white">ยินดีต้อนรับสู่ Orange Music</p>
            <p className="text-[11px] text-text-muted">เลือกเพลงที่คุณชื่นชอบเพื่อเริ่มฟังฟรีได้ทันที</p>
          </div>
        </div>
        <div className="text-[11px] text-orange-400 font-medium hidden sm:block">
          ไม่มีโฆษณาคั่น • ฟรี 100% สำหรับการศึกษา
        </div>
      </footer>
    );
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดถูกใจเพลง', 'info');
      return;
    }
    try {
      const res = await api.post(`/likes/${currentSong.id}`);
      if (res.success) {
        updateSongLikeStatus(currentSong.id, res.is_liked, res.like_count);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('ไม่สามารถกดถูกใจได้', 'error');
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const coverUrl = currentSong.cover_path
    ? getFullMediaUrl(currentSong.cover_path)
    : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100';

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-dark-surface/95 backdrop-blur-md border-t border-dark-border px-4 py-2.5 h-[84px] flex items-center justify-between gap-2 sm:gap-6 shadow-dialog select-none">
        {/* ฝั่งซ้าย: ข้อมูลเพลงที่กำลังเล่น */}
        <div className="flex items-center space-x-3 min-w-0 w-1/4 sm:w-1/3 max-w-[280px]">
          <Link to={`/songs/${currentSong.id}`} className="relative flex-shrink-0 group">
            <img
              src={coverUrl}
              alt={currentSong.title}
              className={`w-12 h-12 rounded-lg object-cover bg-dark-card border border-dark-border ${
                isPlaying ? 'ring-1 ring-orange-500' : ''
              }`}
            />
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              to={`/songs/${currentSong.id}`}
              className="text-xs sm:text-sm font-bold text-white hover:text-orange-400 transition-colors truncate block"
              title={currentSong.title}
            >
              {currentSong.title}
            </Link>
            <p className="text-[11px] text-text-sub truncate" title={currentSong.artist}>
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={handleLikeToggle}
            aria-label="ถูกใจเพลง"
            className={`p-1.5 rounded-full hover:scale-110 transition-transform hidden xs:block ${
              currentSong.is_liked ? 'text-orange-500' : 'text-text-muted hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${currentSong.is_liked ? 'fill-orange-500' : ''}`} />
          </button>
        </div>

        {/* ตรงกลาง: ปุ่มควบคุมเพลงและ Seekbar */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl space-y-1">
          {/* แผงปุ่มควบคุม */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* สุ่มเพลง (Shuffle) */}
            <button
              onClick={toggleShuffle}
              title="สลับเพลงแบบสุ่ม"
              className={`p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-orange-500' : 'text-text-muted hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* ย้อนเพลง (Previous) */}
            <button
              onClick={prevSong}
              title="เพลงก่อนหน้า"
              className="p-1.5 text-text-sub hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* ปุ่ม Play / Pause ทรงกลมส้ม (#FF7A00) 50% Radius */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'หยุดเล่น' : 'เล่นต่อ'}
              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-glow-orange transition-all transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black stroke-black" />
              ) : (
                <Play className="w-5 h-5 fill-black stroke-black translate-x-0.5" />
              )}
            </button>

            {/* ข้ามเพลง (Next) */}
            <button
              onClick={nextSong}
              title="เพลงถัดไป"
              className="p-1.5 text-text-sub hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* วนซ้ำ (Repeat / Loop) */}
            <button
              onClick={toggleLoop}
              title="เล่นวนซ้ำเพลงนี้"
              className={`p-1.5 rounded-full transition-colors ${
                isLoop ? 'text-orange-500' : 'text-text-muted hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* แถบเวลาและ Progress Bar */}
          <div className="w-full flex items-center space-x-2 text-[10px] text-text-sub range-container font-mono">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #FF7A00 ${progressPercent}%, #333333 ${progressPercent}%)`
                }}
              />
            </div>
            <span className="w-9">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ฝั่งขวา: ปรับระดับเสียง และปุ่มเครื่องมือ */}
        <div className="flex items-center justify-end space-x-3 w-1/4 sm:w-1/3 max-w-[240px]">
          {/* ปุ่มเนื้อเพลง */}
          <button
            onClick={() => setShowLyricsModal(true)}
            title="ดูเนื้อเพลง"
            className={`p-1.5 rounded-full transition-colors hidden sm:block ${
              showLyricsModal ? 'text-orange-500 bg-orange-500/10' : 'text-text-sub hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* ปุ่มรายการคิวเพลง */}
          <button
            onClick={() => setShowQueueModal(!showQueueModal)}
            title="คิวเพลง"
            className={`p-1.5 rounded-full transition-colors hidden sm:block ${
              showQueueModal ? 'text-orange-500 bg-orange-500/10' : 'text-text-sub hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* ปุ่มและ Slider เสียง */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              className="text-text-sub hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 hidden md:block"
              style={{
                background: `linear-gradient(to right, #FF7A00 ${
                  (isMuted ? 0 : volume) * 100
                }%, #333333 ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
          </div>
        </div>
      </footer>

      {/* Modal เนื้อเพลง (Lyrics Modal) */}
      {showLyricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-2xl p-6 shadow-dialog space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">เนื้อเพลง: {currentSong.title}</h3>
              </div>
              <button
                onClick={() => setShowLyricsModal(false)}
                className="text-text-muted hover:text-white p-1 rounded-full hover:bg-dark-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 py-2 text-center space-y-3 font-sans">
              {currentSong.lyrics ? (
                <p className="text-sm md:text-base text-text-sub whitespace-pre-line leading-loose">
                  {currentSong.lyrics}
                </p>
              ) : (
                <div className="py-12 text-text-muted text-sm">
                  <p>ยังไม่มีเนื้อเพลงสำหรับบทเพลงนี้</p>
                  <p className="text-xs mt-1">เพลิดเพลินไปกับท่วงทำนองดนตรีอันไพเราะ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal คิวเพลง (Queue Modal) */}
      {showQueueModal && (
        <div className="fixed bottom-24 right-4 z-50 w-80 bg-dark-surface border border-dark-border rounded-2xl shadow-dialog p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-2">
            <div className="flex items-center space-x-2">
              <ListMusic className="w-4 h-4 text-orange-500" />
              <h4 className="text-sm font-bold text-white">คิวเพลงที่กำลังเล่น</h4>
            </div>
            <button
              onClick={() => setShowQueueModal(false)}
              className="text-text-muted hover:text-white p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {queue.map((s, idx) => (
              <button
                key={`${s.id}-${idx}`}
                onClick={() => playSong(s, queue)}
                className={`w-full flex items-center space-x-2.5 p-2 rounded-lg text-left transition-colors ${
                  currentSong.id === s.id ? 'bg-orange-500/15 text-orange-400 font-bold' : 'hover:bg-dark-card text-text-sub'
                }`}
              >
                <span className="w-4 text-center text-[10px] text-text-muted">{idx + 1}</span>
                <img
                  src={s.cover_path ? getFullMediaUrl(s.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=50'}
                  alt={s.title}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs">{s.title}</p>
                  <p className="truncate text-[10px] text-text-muted">{s.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
