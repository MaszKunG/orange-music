import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, Play, Music, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import SongCard from '../components/song/SongCard';
import { usePlayer } from '../context/PlayerContext';

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('id');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam ? parseInt(categoryIdParam) : null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadSongs();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.categories);
        if (!selectedCategory && res.categories.length > 0 && !categoryIdParam) {
          // ค่าเริ่มต้นแสดงหมวดแรก
          setSelectedCategory(res.categories[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCatIcon = (name = '') => {
    if (name.includes('เพลงไทย') || name.includes('🇹🇭')) return '🇹🇭';
    if (name.includes('เพลงสากล') || name.includes('🌍') || name.includes('International')) return '🌍';
    if (name.includes('อ่านหนังสือ') || name.includes('Study')) return '📚';
    if (name.includes('อะคูสติก') || name.includes('Acoustic')) return '🎸';
    if (name.includes('ป๊อป') || name.includes('Pop')) return '🎧';
    if (name.includes('เปียโน') || name.includes('Piano')) return '🎹';
    if (name.includes('อินดี้') || name.includes('Lo-Fi')) return '☕';
    if (name.includes('พลังบวก') || name.includes('Rock')) return '🔥';
    return '🍊';
  };

  const loadSongs = async () => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      const res = await api.get(`/songs?category_id=${selectedCategory}`);
      if (res.success && res.songs.length > 0) {
        setSongs(res.songs);
      } else {
        // ถ้าหมวดหมู่นี้ยังไม่มีเพลงผูกตรงๆ แต่เป็นหมวดเพลงไทยหรือสากล ให้ดึงเพลงตามภาษามาแสดง
        const cat = categories.find((c) => c.id === selectedCategory);
        if (cat && (cat.name.includes('เพลงไทย') || cat.name.includes('Thai'))) {
          const allRes = await api.get('/songs');
          if (allRes.success) {
            const thaiSongs = allRes.songs.filter(
              (s) => /[\u0E00-\u0E7F]/.test(s.title || '') || /[\u0E00-\u0E7F]/.test(s.artist || '')
            );
            setSongs(thaiSongs);
          }
        } else if (cat && (cat.name.includes('เพลงสากล') || cat.name.includes('International'))) {
          const allRes = await api.get('/songs');
          if (allRes.success) {
            const interSongs = allRes.songs.filter(
              (s) => !/[\u0E00-\u0E7F]/.test(s.title || '') && !/[\u0E00-\u0E7F]/.test(s.artist || '')
            );
            setSongs(interSongs);
          }
        } else {
          setSongs(res.songs || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentCat = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
          <Grid className="w-7 h-7 text-orange-500" />
          <span>หมวดหมู่เพลง (Categories)</span>
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">
          เลือกฟังตามแนวเพลง อารมณ์ และช่วงเวลาการเรียนรู้ที่คุณต้องการ
        </p>
      </div>

      {/* แถบหมวดหมู่ Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchParams({ id: cat.id });
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between h-28 group ${
                isSelected
                  ? 'bg-gradient-to-br from-orange-500/30 to-dark-surface border-orange-500 shadow-glow-orange-sm ring-1 ring-orange-500'
                  : 'bg-dark-surface hover:bg-dark-card border-dark-border hover:border-dark-borderSubtle'
              }`}
            >
              <div>
                <span className="text-xl">{getCatIcon(cat.name)}</span>
                <p className={`text-xs font-bold mt-1 line-clamp-2 ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                  {cat.name.replace(/^[^\w\s\u0E00-\u0E7F]+\s*/, '').split('(')[0]}
                </p>
              </div>
              <span className="text-[10px] text-text-muted">{cat.song_count || 0} เพลง</span>
            </button>
          );
        })}
      </div>

      {/* ส่วนแสดงเพลงในหมวดหมู่ที่เลือก */}
      {currentCat && (
        <section className="space-y-4 pt-4 border-t border-dark-borderSubtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-surface p-5 rounded-2xl border border-dark-border">
            <div>
              <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                หมวดหมู่ที่เลือก
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{currentCat.name}</h2>
              <p className="text-xs text-text-sub mt-1">{currentCat.description}</p>
            </div>

            {songs.length > 0 && (
              <button
                onClick={() => playSong(songs[0], songs)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>เล่นเพลงทั้งหมด ({songs.length})</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-text-muted text-sm">กำลังโหลดเพลง...</div>
          ) : songs.length === 0 ? (
            <div className="text-center py-12 bg-dark-surface rounded-2xl border border-dark-border p-8">
              <Music className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">ยังไม่มีเพลงในหมวดหมู่นี้</p>
              <p className="text-xs text-text-sub mt-1">สามารถเลือกหมวดหมู่อื่นเพื่อรับฟังได้</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} playlist={songs} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
