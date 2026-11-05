import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ListMusic, Play, Trash2, ArrowLeft, Music, Clock } from 'lucide-react';
import { api, getFullMediaUrl } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteSongTarget, setDeleteSongTarget] = useState(null);
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { showToast } = useToast();

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/playlists/${id}`);
      if (res.success) {
        setPlaylist(res.playlist);
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดเพลย์ลิสต์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist?.songs?.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  const handleRemoveSong = async () => {
    if (!deleteSongTarget) return;
    try {
      const res = await api.delete(`/playlists/${id}/songs/${deleteSongTarget.id}`);
      if (res.success) {
        showToast(`ลบเพลง "${deleteSongTarget.title}" ออกจากเพลย์ลิสต์แล้ว`, 'success');
        setDeleteSongTarget(null);
        loadPlaylist();
      }
    } catch (err) {
      showToast('ไม่สามารถลบเพลงออกจากเพลย์ลิสต์ได้', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted text-sm">กำลังโหลดข้อมูลเพลย์ลิสต์...</div>;
  }

  if (!playlist) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-white text-base font-bold">ไม่พบเพลย์ลิสต์</p>
        <Link to="/my-playlists" className="inline-flex items-center space-x-2 text-xs text-orange-400 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้าเพลย์ลิสต์</span>
        </Link>
      </div>
    );
  }

  const songs = playlist.songs || [];

  return (
    <div className="space-y-8 pb-20">
      <Link
        to="/my-playlists"
        className="inline-flex items-center space-x-1.5 text-xs text-text-sub hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับไปเพลย์ลิสต์ทั้งหมด</span>
      </Link>

      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-t from-dark-surface to-dark-card/50 p-6 sm:p-8 rounded-3xl border border-dark-border shadow-dialog">
        <div className="w-44 h-44 rounded-2xl bg-dark-card flex items-center justify-center overflow-hidden flex-shrink-0 border border-dark-borderSubtle shadow-xl">
          {songs.length > 0 && songs[0].cover_path ? (
            <img
              src={getFullMediaUrl(songs[0].cover_path)}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-orange-500/40 text-5xl">🍊</div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">
            เพลย์ลิสต์ส่วนตัว
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {playlist.name}
          </h1>
          <p className="text-xs text-text-sub">
            สร้างโดย <span className="text-white font-bold">{playlist.creator_name}</span> • {songs.length} เพลง
          </p>

          {songs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>เล่นทั้งหมด</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Song Table */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {songs.length === 0 ? (
          <div className="text-center py-16 text-text-muted space-y-2">
            <Music className="w-10 h-10 mx-auto text-text-muted/60" />
            <p className="text-sm font-semibold text-white">เพลย์ลิสต์นี้ยังไม่มีเพลง</p>
            <p className="text-xs">ค้นหาเพลงที่คุณชอบแล้วกดปุ่ม "+" เพื่อเพิ่มลงในเพลย์ลิสต์นี้</p>
            <Link
              to="/search"
              className="inline-block mt-3 px-4 py-1.5 rounded-full bg-dark-card hover:bg-dark-elevated text-orange-400 border border-orange-500/30 text-xs font-bold"
            >
              ค้นหาเพลงใหม่
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-dark-borderSubtle">
            {songs.map((song, index) => {
              const isThisSong = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3.5 hover:bg-dark-card transition-colors group ${
                    isThisSong ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="w-6 text-center text-xs text-text-muted font-mono">
                      {index + 1}
                    </span>

                    <button
                      onClick={() => playSong(song, songs)}
                      className="w-10 h-10 rounded-lg overflow-hidden bg-dark-card flex-shrink-0 relative group/btn"
                    >
                      <img
                        src={song.cover_path ? getFullMediaUrl(song.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/songs/${song.id}`}
                        className={`text-sm font-bold truncate block hover:text-orange-400 ${
                          isThisSong ? 'text-orange-400' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </Link>
                      <p className="text-xs text-text-sub truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="hidden md:block text-xs text-text-muted px-4 min-w-[120px]">
                    {song.category_name || '-'}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDeleteSongTarget(song)}
                      className="p-2 text-text-muted hover:text-red-400 rounded-lg hover:bg-dark-elevated transition-colors"
                      title="ลบออกจากเพลย์ลิสต์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteSongTarget}
        title="นำเพลงออกจากเพลย์ลิสต์"
        message={`คุณต้องการนำเพลง "${deleteSongTarget?.title}" ออกจากเพลย์ลิสต์นี้ใช่หรือไม่?`}
        confirmText="นำออก"
        onConfirm={handleRemoveSong}
        onCancel={() => setDeleteSongTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
