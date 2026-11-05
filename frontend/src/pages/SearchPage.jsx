import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Music, User, Grid, Play, Clock, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import SongCard from '../components/song/SongCard';
import { usePlayer } from '../context/PlayerContext';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'songs', 'artists', 'categories'
  const [sortBy, setSortBy] = useState(initialSort);
  const [songs, setSongs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetchResults();
  }, [query, sortBy]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append('search', query.trim());
      if (sortBy) params.append('sort', sortBy);

      const [songsRes, catsRes] = await Promise.all([
        api.get(`/songs?${params.toString()}`),
        api.get('/categories')
      ]);

      if (songsRes.success) {
        setSongs(songsRes.songs);
      }
      if (catsRes.success) {
        if (query.trim()) {
          const filtered = catsRes.categories.filter((c) =>
            c.name.toLowerCase().includes(query.trim().toLowerCase())
          );
          setCategories(filtered);
        } else {
          setCategories(catsRes.categories);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query, sort: sortBy });
  };

  // กรองตามแท็บ
  // ศิลปินที่ไม่ซ้ำ
  const artistsMap = new Map();
  songs.forEach((s) => {
    if (!artistsMap.has(s.artist)) {
      artistsMap.set(s.artist, { name: s.artist, count: 1, sampleSong: s });
    } else {
      artistsMap.get(s.artist).count += 1;
    }
  });
  const artists = Array.from(artistsMap.values());

  return (
    <div className="space-y-6 pb-20">
      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto space-y-4 pt-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเพลง, ศิลปิน, หมวดหมู่ดนตรี..."
            className="w-full bg-dark-surface text-white text-base placeholder-text-muted pl-12 pr-4 py-3.5 rounded-full border border-dark-border focus:border-orange-500 focus:bg-dark-card focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-dialog"
            autoFocus
          />
          <Search className="w-5 h-5 text-orange-500 absolute left-4 top-1/2 -translate-y-1/2" />
        </form>

        {/* แถบแยกแท็บ: ทั้งหมด / เพลง / ศิลปิน / หมวดหมู่ */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <div className="flex items-center space-x-2">
            {[
              { id: 'all', label: 'ทั้งหมด', icon: Grid },
              { id: 'songs', label: `เพลง (${songs.length})`, icon: Music },
              { id: 'artists', label: `ศิลปิน (${artists.length})`, icon: User },
              { id: 'categories', label: `หมวดหมู่ (${categories.length})`, icon: Grid },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-black shadow-glow-orange-sm'
                      : 'bg-dark-card text-text-sub hover:text-white border border-dark-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* เรียงลำดับ */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-text-muted">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-card text-white px-3 py-1.5 rounded-full border border-dark-border focus:outline-none focus:border-orange-500 text-xs"
            >
              <option value="newest">มาใหม่ล่าสุด</option>
              <option value="popular">ยอดนิยมสูงสุด</option>
              <option value="title">ชื่อเพลง (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">กำลังค้นหาข้อมูล...</div>
      ) : (
        <div className="space-y-8">
          {/* ผลลัพธ์: ศิลปิน (ถ้าเลือกแท็บ all หรือ artists) */}
          {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-orange-500" />
                <span>ศิลปิน ({artists.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {artists.map((art) => (
                  <div
                    key={art.name}
                    onClick={() => {
                      setQuery(art.name);
                      setActiveTab('songs');
                    }}
                    className="p-3 bg-dark-surface hover:bg-dark-card rounded-2xl border border-dark-borderSubtle text-center cursor-pointer transition-all hover:scale-105 group"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-dark-elevated overflow-hidden mb-2 border border-orange-500/30 group-hover:border-orange-500">
                      <img
                        src={art.sampleSong?.cover_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                        alt={art.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold text-white truncate group-hover:text-orange-400">
                      {art.name}
                    </p>
                    <span className="text-[10px] text-text-muted">{art.count} เพลง</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ผลลัพธ์: หมวดหมู่ (ถ้าเลือกแท็บ all หรือ categories) */}
          {(activeTab === 'all' || activeTab === 'categories') && categories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Grid className="w-4 h-4 text-orange-500" />
                <span>หมวดหมู่เพลง ({categories.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories?id=${cat.id}`}
                    className="p-3 bg-dark-surface hover:bg-dark-card rounded-xl border border-dark-border text-center transition-colors group"
                  >
                    <span className="text-xl block mb-1">🍊</span>
                    <p className="text-xs font-bold text-white truncate group-hover:text-orange-400">
                      {cat.name.split('(')[0]}
                    </p>
                    <span className="text-[10px] text-text-muted">{cat.song_count || 0} เพลง</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ผลลัพธ์: เพลง (ถ้าเลือกแท็บ all หรือ songs) */}
          {(activeTab === 'all' || activeTab === 'songs') && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Music className="w-4 h-4 text-orange-500" />
                <span>เพลง ({songs.length})</span>
              </h3>

              {songs.length === 0 ? (
                <div className="text-center py-12 bg-dark-surface rounded-2xl border border-dark-border p-6">
                  <p className="text-sm font-semibold text-white">ไม่พบเพลงที่ตรงกับการค้นหา</p>
                  <p className="text-xs text-text-sub mt-1">ลองเปลี่ยนคำค้นหา หรือค้นหาด้วยชื่อศิลปินอื่น</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {songs.map((song) => (
                    <SongCard key={song.id} song={song} playlist={songs} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
