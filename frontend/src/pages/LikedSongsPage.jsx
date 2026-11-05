import React, { useState, useEffect } from 'react';
import { Heart, Play, Music, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import SongCard from '../components/song/SongCard';
import { usePlayer } from '../context/PlayerContext';

export default function LikedSongsPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    loadLikedSongs();
  }, []);

  const loadLikedSongs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/likes');
      if (res.success) {
        setSongs(res.songs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner เพลงที่ถูกใจ */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-br from-[#2D1204] via-dark-surface to-dark-card p-6 sm:p-8 rounded-3xl border border-orange-500/30 shadow-dialog">
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-glow-orange text-black">
          <Heart className="w-20 h-20 fill-black stroke-black" />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>คลังเพลงโปรดของคุณ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            เพลงที่ถูกใจ (Liked Songs)
          </h1>
          <p className="text-xs text-text-sub">{songs.length} บทเพลงที่คุณหลงรัก</p>

          {songs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>เล่นเพลงที่ถูกใจทั้งหมด</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดเพลงที่ถูกใจ...</div>
      ) : songs.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface rounded-3xl border border-dark-border p-8 space-y-3">
          <Heart className="w-12 h-12 text-text-muted mx-auto stroke-1" />
          <h3 className="text-base font-bold text-white">คุณยังไม่ได้กดถูกใจเพลงใดๆ</h3>
          <p className="text-xs text-text-sub max-w-sm mx-auto">
            เมื่อคุณเจอเพลงที่ชอบระหว่างฟัง ให้กดไอคอนรูปหัวใจเพื่อบันทึกไว้ในหน้านี้
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} playlist={songs} />
          ))}
        </div>
      )}
    </div>
  );
}
