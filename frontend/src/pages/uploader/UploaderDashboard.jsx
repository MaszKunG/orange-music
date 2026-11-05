import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, UploadCloud, Eye, Heart, Plus, ListMusic, TrendingUp } from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UploaderDashboard() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMySongs();
  }, [user]);

  const loadMySongs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/songs?uploader_id=${user.id}`);
      if (res.success) {
        setSongs(res.songs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPlays = songs.reduce((acc, s) => acc + (s.play_count || 0), 0);
  const totalLikes = songs.reduce((acc, s) => acc + (s.like_count || 0), 0);
  const topSong = [...songs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0))[0];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Music className="w-7 h-7 text-orange-500" />
            <span>แดชบอร์ดผู้อัปโหลดเพลง</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            ยินดีต้อนรับคุณ <span className="text-white font-bold">{user?.full_name}</span> จัดการและติดตามผลงานเพลงของคุณ
          </p>
        </div>

        <Link
          to="/uploader/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>อัปโหลดเพลงใหม่</span>
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted">ผลงานเพลงของคุณ</p>
            <p className="text-2xl font-black text-white">{songs.length} <span className="text-xs font-normal text-text-sub">เพลง</span></p>
          </div>
        </div>

        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted">ยอดการฟังรวมทั้งหมด</p>
            <p className="text-2xl font-black text-white">{totalPlays.toLocaleString()} <span className="text-xs font-normal text-text-sub">ครั้ง</span></p>
          </div>
        </div>

        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted">ยอดถูกใจรวม</p>
            <p className="text-2xl font-black text-white">{totalLikes.toLocaleString()} <span className="text-xs font-normal text-text-sub">ครั้ง</span></p>
          </div>
        </div>
      </div>

      {/* เพลงยอดนิยมของฉัน */}
      {topSong && (
        <div className="bg-gradient-to-r from-dark-surface via-[#22160d] to-dark-surface p-6 rounded-3xl border border-orange-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={topSong.cover_path ? getFullMediaUrl(topSong.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt={topSong.title}
              className="w-16 h-16 rounded-xl object-cover border border-orange-500/40"
            />
            <div>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30 uppercase">
                เพลงยอดนิยมสูงสุดของคุณ 👑
              </span>
              <h3 className="text-base font-bold text-white mt-1">{topSong.title}</h3>
              <p className="text-xs text-text-sub">ฟังแล้ว {topSong.play_count} ครั้ง • {topSong.like_count || 0} ถูกใจ</p>
            </div>
          </div>

          <Link
            to="/uploader/my-songs"
            className="hidden sm:inline-flex px-4 py-2 rounded-full bg-dark-card hover:bg-dark-elevated text-xs font-bold text-white border border-dark-border"
          >
            จัดการเพลง
          </Link>
        </div>
      )}

      {/* เพลงล่าสุดของฉัน */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">เพลงล่าสุดของคุณ</h2>
          <Link to="/uploader/my-songs" className="text-xs font-semibold text-orange-400 hover:underline">
            ดูทั้งหมด ({songs.length})
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">กำลังโหลดข้อมูล...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12 bg-dark-surface rounded-2xl border border-dark-border p-8 space-y-3">
            <UploadCloud className="w-10 h-10 text-orange-400 mx-auto" />
            <h3 className="text-base font-bold text-white">ยังไม่มีเพลงที่อัปโหลด</h3>
            <p className="text-xs text-text-sub max-w-sm mx-auto">
              เริ่มต้นแชร์ผลงานเพลงของคุณให้เพื่อนๆ นักเรียน นักศึกษาทั่วประเทศได้ฟัง
            </p>
            <Link
              to="/uploader/upload"
              className="inline-block mt-2 px-5 py-2 rounded-full bg-orange-500 text-black font-bold text-xs"
            >
              อัปโหลดเพลงแรกของคุณ
            </Link>
          </div>
        ) : (
          <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden divide-y divide-dark-borderSubtle">
            {songs.slice(0, 5).map((song) => (
              <div key={song.id} className="p-3.5 flex items-center justify-between hover:bg-dark-card transition-colors">
                <div className="flex items-center space-x-3">
                  <img
                    src={song.cover_path ? getFullMediaUrl(song.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <Link to={`/songs/${song.id}`} className="text-sm font-bold text-white hover:text-orange-400 transition-colors">
                      {song.title}
                    </Link>
                    <p className="text-xs text-text-sub">{song.artist} • {song.category_name || 'ทั่วไป'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-text-muted">
                  <span>ฟัง {song.play_count || 0} ครั้ง</span>
                  <Link
                    to="/uploader/my-songs"
                    className="text-orange-400 hover:underline font-semibold"
                  >
                    แก้ไข
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
