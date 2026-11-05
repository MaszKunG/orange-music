import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, Plus, Music2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { api, getFullMediaUrl, DEFAULT_COVER } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AddToPlaylistModal from '../playlist/AddToPlaylistModal';

export default function SongCard({ song, playlist = [] }) {
  const { currentSong, isPlaying, playSong, updateSongLikeStatus } = usePlayer();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    playSong(song, playlist);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดถูกใจเพลง', 'info');
      return;
    }
    if (isLiking) return;

    try {
      setIsLiking(true);
      const res = await api.post(`/likes/${song.id}`);
      if (res.success) {
        updateSongLikeStatus(song.id, res.is_liked, res.like_count);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('ไม่สามารถกดถูกใจได้', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddPlaylistClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มเพลงลงเพลย์ลิสต์', 'info');
      return;
    }
    setShowPlaylistModal(true);
  };

  const coverUrl = song.cover_path 
    ? getFullMediaUrl(song.cover_path) 
    : DEFAULT_COVER;

  return (
    <>
      <div className="group relative bg-dark-surface hover:bg-dark-card p-3.5 rounded-xl border border-dark-borderSubtle hover:border-dark-border transition-all duration-300 hover:shadow-card flex flex-col justify-between">
        <Link to={`/songs/${song.id}`} className="block">
          {/* ส่วนรูปภาพหน้าปกและปุ่ม Play แบบลอย */}
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-dark-elevated mb-3 shadow-md">
            <img
              src={coverUrl}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_COVER;
              }}
            />

            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Circular Play Button ทรงกลมส้ม (#FF7A00) สไตล์ Spotify */}
            <button
              onClick={handlePlayClick}
              aria-label={isThisPlaying ? 'หยุดเล่น' : 'เล่นเพลง'}
              className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-glow-orange transition-all duration-300 transform ${
                isThisPlaying
                  ? 'opacity-100 translate-y-0 scale-100 ring-2 ring-orange-300'
                  : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110'
              }`}
            >
              {isThisPlaying ? (
                <Pause className="w-5 h-5 fill-black stroke-black" />
              ) : (
                <Play className="w-5 h-5 fill-black stroke-black translate-x-0.5" />
              )}
            </button>

            {/* Tag หมวดหมู่ */}
            {song.category_name && (
              <span className="absolute top-2 left-2 text-[10px] font-semibold bg-dark-base/80 backdrop-blur-md text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                {song.category_name}
              </span>
            )}
          </div>

          {/* ข้อมูลเพลง */}
          <div>
            <h3
              className={`text-sm font-bold truncate transition-colors ${
                isCurrent ? 'text-orange-400 font-extrabold' : 'text-white group-hover:text-orange-300'
              }`}
              title={song.title}
            >
              {song.title}
            </h3>
            <p className="text-xs text-text-sub truncate mt-0.5" title={song.artist}>
              {song.artist}
            </p>
          </div>
        </Link>

        {/* แถบการทำงานเสริม (Like, Playlist, Play Count) */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark-borderSubtle text-text-muted text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeClick}
              disabled={isLiking}
              title={song.is_liked ? 'เลิกถูกใจ' : 'ถูกใจ'}
              className={`p-1 rounded-full transition-transform hover:scale-125 ${
                song.is_liked ? 'text-orange-500' : 'text-text-muted hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${song.is_liked ? 'fill-orange-500' : ''}`} />
            </button>
            <button
              onClick={handleAddPlaylistClick}
              title="เพิ่มลงเพลย์ลิสต์"
              className="p-1 rounded-full text-text-muted hover:text-white hover:scale-125 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] text-text-muted flex items-center space-x-1">
            <Music2 className="w-3 h-3 text-orange-500/70" />
            <span>{song.play_count || 0} ครั้ง</span>
          </span>
        </div>
      </div>

      {/* Modal เพิ่มลงเพลย์ลิสต์ */}
      <AddToPlaylistModal
        song={song}
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
      />
    </>
  );
}
