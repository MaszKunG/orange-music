import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Heart, 
  Plus, 
  Clock, 
  Eye, 
  Tag, 
  User, 
  FileText, 
  ArrowLeft 
} from 'lucide-react';
import { api, getFullMediaUrl, DEFAULT_COVER } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddToPlaylistModal from '../components/playlist/AddToPlaylistModal';
import SongCard from '../components/song/SongCard';

export default function SongDetailPage() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { currentSong, isPlaying, playSong, updateSongLikeStatus } = usePlayer();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadSong();
  }, [id]);

  const loadSong = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/songs/${id}`);
      if (res.success) {
        setSong(res.song);

        // ดึงเพลงที่เกี่ยวข้องในหมวดหมู่เดียวกัน
        if (res.song.category_id) {
          const relRes = await api.get(`/songs?category_id=${res.song.category_id}&limit=5`);
          if (relRes.success) {
            setRelatedSongs(relRes.songs.filter((s) => s.id !== parseInt(id)));
          }
        }
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลเพลงได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCurrent = currentSong?.id === song?.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    if (song) {
      playSong(song, [song, ...relatedSongs]);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดถูกใจเพลง', 'info');
      return;
    }
    try {
      const res = await api.post(`/likes/${song.id}`);
      if (res.success) {
        setSong((prev) => ({
          ...prev,
          is_liked: res.is_liked,
          like_count: res.like_count
        }));
        updateSongLikeStatus(song.id, res.is_liked, res.like_count);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการกดถูกใจ', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted text-sm">กำลังโหลดข้อมูลบทเพลง...</div>;
  }

  if (!song) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-white text-base font-bold">ไม่พบบทเพลงที่ต้องการ</p>
        <Link to="/" className="inline-flex items-center space-x-2 text-xs text-orange-400 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าแรก</span>
        </Link>
      </div>
    );
  }

  const coverUrl = song.cover_path
    ? getFullMediaUrl(song.cover_path)
    : DEFAULT_COVER;

  return (
    <div className="space-y-10 pb-20">
      <Link
        to="/"
        className="inline-flex items-center space-x-1.5 text-xs text-text-sub hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับ</span>
      </Link>

      {/* Hero ส่วนหัวของเพลง */}
      <section className="flex flex-col md:flex-row items-center md:items-end gap-6 bg-gradient-to-t from-dark-surface to-dark-card/50 p-6 sm:p-8 rounded-3xl border border-dark-border shadow-dialog">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-dark-card border border-dark-borderSubtle">
          <img 
            src={coverUrl} 
            alt={song.title} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_COVER;
            }}
          />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          {song.category_name && (
            <span className="inline-block text-[11px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              {song.category_name}
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {song.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-text-sub">
            <span className="text-white font-bold">{song.artist}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>ผู้อัปโหลด: {song.uploader_name || 'ศิลปินอิสระ'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>ฟังแล้ว {song.play_count || 0} ครั้ง</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Heart className="w-3.5 h-3.5 text-orange-400" />
              <span>{song.like_count || 0} ถูกใจ</span>
            </span>
          </div>

          {/* แผงปุ่มควบคุมหลัก */}
          <div className="flex items-center justify-center md:justify-start space-x-4 pt-3">
            <button
              onClick={handlePlay}
              className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
            >
              {isThisPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-black stroke-black" />
                  <span>หยุดเพลง</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-black stroke-black" />
                  <span>เริ่มเล่นเพลง</span>
                </>
              )}
            </button>

            <button
              onClick={handleLike}
              className={`p-3 rounded-full border transition-all ${
                song.is_liked
                  ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-glow-orange-sm'
                  : 'bg-dark-card border-dark-border text-text-sub hover:text-white hover:border-text-muted'
              }`}
            >
              <Heart className={`w-5 h-5 ${song.is_liked ? 'fill-orange-500' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มเพลงลงเพลย์ลิสต์', 'info');
                  return;
                }
                setShowPlaylistModal(true);
              }}
              className="p-3 rounded-full bg-dark-card border border-dark-border text-text-sub hover:text-white hover:border-text-muted transition-colors"
              title="เพิ่มลงเพลย์ลิสต์"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* เนื้อเพลง & คำอธิบาย */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-dark-surface p-6 sm:p-8 rounded-3xl border border-dark-border space-y-4">
          <div className="flex items-center space-x-2 border-b border-dark-borderSubtle pb-3">
            <FileText className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-white">เนื้อร้อง / บทประพันธ์ (Lyrics)</h2>
          </div>

          {song.description && (
            <p className="text-xs sm:text-sm text-orange-300/80 bg-orange-950/20 p-3.5 rounded-xl border border-orange-500/20">
              💡 {song.description}
            </p>
          )}

          <div className="pt-2 text-text-sub text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
            {song.lyrics || 'ไม่มีข้อมูลเนื้อร้องสำหรับบทเพลงนี้ (เป็นเพลงบรรเลง หรือยังไม่มีการระบุเนื้อร้อง)'}
          </div>
        </div>

        {/* เพลงที่เกี่ยวข้องในหมวดหมู่เดียวกัน */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-bold text-white">เพลงอื่นในหมวดเดียวกัน</h3>
          {relatedSongs.length === 0 ? (
            <p className="text-xs text-text-muted">ไม่มีเพลงอื่นในหมวดหมู่นี้</p>
          ) : (
            <div className="space-y-3">
              {relatedSongs.map((rel) => (
                <SongCard key={rel.id} song={rel} playlist={[song, ...relatedSongs]} />
              ))}
            </div>
          )}
        </div>
      </section>

      <AddToPlaylistModal
        song={song}
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
      />
    </div>
  );
}
