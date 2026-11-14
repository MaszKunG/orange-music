import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Grid, 
  UploadCloud, 
  Headphones, 
  ShieldCheck, 
  Heart, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { api, getFullMediaUrl, DEFAULT_COVER } from '../services/api';
import SongCard from '../components/song/SongCard';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

export default function LandingHomePage() {
  const [songs, setSongs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();
  const { isAuthenticated, isUploader } = useAuth();

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const songUrl = selectedCategory ? `/songs?category_id=${selectedCategory}` : '/songs';
      const [songsRes, catsRes] = await Promise.all([
        api.get(songUrl),
        api.get('/categories')
      ]);

      if (songsRes.success) {
        setSongs(songsRes.songs);
      }
      if (catsRes.success) {
        setCategories(catsRes.categories);
      }
    } catch (err) {
      console.error('Load home data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const popularSongs = [...songs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 4);
  const newestSongs = [...songs].slice(0, 8);
  const featuredSong = songs[0];

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Hero Section: Dark Immersive Theme + Vibrant Orange Glow */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#241305] via-dark-surface to-dark-base border border-orange-500/30 p-4 sm:p-8 lg:p-12 shadow-dialog">
        {/* แสงเรืองแสงสีส้มแบบ Ambient Glow ด้านหลัง */}
        <div className="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 sm:w-80 h-60 sm:h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* ข้อมูลฝั่งซ้าย */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center space-x-2 bg-orange-500/15 border border-orange-500/30 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span>ฟรี 100% สำหรับการศึกษา • ไม่มีโฆษณาคั่น</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              สดใสทุกจังหวะ <br className="hidden sm:inline" />
              ไปกับ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300">Orange Music</span> 🍊
            </h1>

            <p className="text-text-sub text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              พื้นที่ฟังเพลงออนไลน์ฟรีที่ดีที่สุดสำหรับนักเรียน นักศึกษา และบุคลากรทางการศึกษา 
              รวมเพลงสำหรับเพิ่มสมาธิในการอ่านหนังสือ ดนตรีสร้างแรงบันดาลใจ 
              และพื้นที่ปล่อยของสำหรับศิลปินหน้าใหม่
            </p>

            {/* ปุ่ม CTA คู่ สไตล์ Pill Geometry */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              {featuredSong && (
                <button
                  onClick={() => playSong(featuredSong, songs)}
                  className="inline-flex items-center justify-center space-x-2.5 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs sm:text-sm shadow-glow-orange transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                  <span>เริ่มฟังเพลงฟรีทันที</span>
                </button>
              )}

              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-dark-card hover:bg-dark-elevated text-white border border-dark-border hover:border-text-muted font-semibold text-xs sm:text-sm transition-all"
                >
                  <span>สมัครสมาชิกร่วมชุมชน</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isUploader ? (
                <Link
                  to="/uploader/upload"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-dark-card hover:bg-dark-elevated text-orange-400 border border-orange-500/40 font-semibold text-xs sm:text-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>อัปโหลดผลงานเพลง</span>
                </Link>
              ) : null}
            </div>

            {/* จุดเด่น 3 ข้อ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-dark-borderSubtle text-xs text-text-sub">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>เพลงเพื่อการเรียน</span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>เสียงคุณภาพสูง</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>ปลอดภัย ไร้ค่าใช้จ่าย</span>
              </div>
            </div>
          </div>

          {/* การ์ดเพลงแนะนำฝั่งขวา (Featured Track Card) */}
          {featuredSong && (
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-dark-surface/90 border border-orange-500/30 rounded-2xl p-4 shadow-dialog hover:border-orange-500/60 transition-all duration-300">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 group bg-dark-card">
                  <img
                    src={getFullMediaUrl(featuredSong.cover_path)}
                    alt={featuredSong.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      if (e.currentTarget.src.includes('maxresdefault.jpg')) {
                        e.currentTarget.src = e.currentTarget.src.replace('maxresdefault.jpg', 'mqdefault.jpg');
                        return;
                      }
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_COVER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-orange-400 bg-black/60 px-2.5 py-1 rounded-full border border-orange-500/30">
                      เพลงแนะนำประจำวันนี้
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="text-base font-bold text-white truncate">{featuredSong.title}</h3>
                    <p className="text-xs text-text-sub truncate">{featuredSong.artist}</p>
                  </div>
                  <button
                    onClick={() => playSong(featuredSong, songs)}
                    className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-glow-orange transition-transform hover:scale-110 flex-shrink-0"
                  >
                    <Play className="w-5 h-5 fill-black stroke-black translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Quick Category Filter Pills */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-orange-500 text-black shadow-glow-orange-sm'
                : 'bg-dark-card hover:bg-dark-surface text-text-sub hover:text-white border border-dark-border'
            }`}
          >
            ทั้งหมด (All)
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-black shadow-glow-orange-sm'
                  : 'bg-dark-card hover:bg-dark-surface text-text-sub hover:text-white border border-dark-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. เพลงยอดนิยม (Popular Tracks) */}
      {popularSongs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-white">เพลงยอดนิยม (Top Tracks)</h2>
            </div>
            <Link to="/search?sort=popular" className="text-xs font-semibold text-orange-400 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularSongs.map((song) => (
              <SongCard key={song.id} song={song} playlist={popularSongs} />
            ))}
          </div>
        </section>
      )}

      {/* 4. เพลงมาใหม่ (New Releases) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">
              {selectedCategory ? 'เพลงในหมวดหมู่นี้' : 'เพลงมาใหม่ & แนะนำ (New Releases)'}
            </h2>
          </div>
          <Link to="/search" className="text-xs font-semibold text-orange-400 hover:underline">
            ค้นหาเพิ่มเติม
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">
            กำลังโหลดรายการเพลง...
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12 bg-dark-surface rounded-2xl border border-dark-border p-8">
            <Headphones className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">ยังไม่มีเพลงในหมวดนี้</p>
            <p className="text-xs text-text-sub mt-1">เลือกหมวดหมู่อื่น หรือเป็นคนแรกที่อัปโหลดเพลงในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {newestSongs.map((song) => (
              <SongCard key={song.id} song={song} playlist={songs} />
            ))}
          </div>
        )}
      </section>

      {/* 5. หมวดหมู่อารมณ์เพลง (Mood & Category Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">สำรวจตามหมวดหมู่ (Categories)</h2>
          </div>
          <Link to="/categories" className="text-xs font-semibold text-orange-400 hover:underline">
            ดูทุกหมวด
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, idx) => {
            const colors = [
              'from-orange-600 to-amber-700',
              'from-amber-600 to-yellow-700',
              'from-red-600 to-orange-700',
              'from-emerald-700 to-teal-800',
              'from-blue-700 to-indigo-800',
              'from-purple-700 to-pink-800'
            ];
            const bgGrad = colors[idx % colors.length];

            return (
              <Link
                key={cat.id}
                to={`/categories?id=${cat.id}`}
                className={`relative aspect-[4/3] rounded-2xl p-4 overflow-hidden bg-gradient-to-br ${bgGrad} flex flex-col justify-between shadow-card hover:scale-105 transition-transform duration-300 group`}
              >
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-white leading-tight drop-shadow">
                    {cat.name.split('(')[0]}
                  </h3>
                  <span className="text-[10px] text-white/80 mt-1 block">
                    {cat.song_count || 0} เพลง
                  </span>
                </div>
                <div className="self-end text-3xl opacity-30 group-hover:opacity-60 transition-opacity">
                  🍊
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. แบนเนอร์เชิญชวนผู้อัปโหลดเพลง (Uploader Community Spotlight) */}
      <section className="bg-gradient-to-r from-dark-surface via-[#20150d] to-dark-surface border border-orange-500/25 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            พื้นที่แสดงผลงานดนตรีของคุณ
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            คุณสร้างสรรค์เพลงอยู่หรือเปล่า? อัปโหลดบทเพลงสู่ Orange Music วันนี้
          </h3>
          <p className="text-xs sm:text-sm text-text-sub max-w-xl">
            เปิดโอกาสให้เพื่อนๆ นักเรียน นักศึกษา และอาจารย์ทั่วประเทศได้รับฟังผลงานดนตรีของคุณ สมัครเป็นผู้อัปโหลดได้ฟรี ไม่มีค่าธรรมเนียม
          </p>
        </div>

        <Link
          to={isAuthenticated ? (isUploader ? '/uploader/upload' : '/profile') : '/register'}
          className="flex-shrink-0 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-105"
        >
          {isAuthenticated && isUploader ? 'อัปโหลดเพลงเลย' : 'สมัครเป็นผู้อัปโหลด'}
        </Link>
      </section>
    </div>
  );
}
