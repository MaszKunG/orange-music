import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  Music, 
  Eye, 
  Tags, 
  ListMusic, 
  TrendingUp, 
  UserCheck, 
  Headphones,
  Award,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted text-sm">กำลังโหลดรายงานสรุปข้อมูล...</div>;
  }

  if (!stats) return null;

  const totalUsers = stats.totalUsers || 1;
  const adminPercent = Math.round(((stats.userRoleCounts?.admin || 0) / totalUsers) * 100);
  const uploaderPercent = Math.round(((stats.userRoleCounts?.uploader || 0) / totalUsers) * 100);
  const userPercent = Math.round(((stats.userRoleCounts?.user || 0) / totalUsers) * 100);

  const maxCategorySongs = Math.max(...(stats.categoryDistribution?.map(c => c.song_count) || [1]), 1);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-red-400 bg-red-950/30 px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Orange Music Administrator System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            รายงานสรุปข้อมูลและสถิติภาพรวม
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            สรุปข้อมูลผู้ใช้งาน ระบบเพลง หมวดหมู่ และพฤติกรรมการฟังเพลงในระบบ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-full bg-dark-card hover:bg-dark-elevated text-white text-xs font-bold border border-dark-border"
          >
            จัดการผู้ใช้
          </Link>
          <Link
            to="/admin/pending-songs"
            className="relative px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            ตรวจสอบเพลง
            {stats.pendingSongs > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                {stats.pendingSongs > 9 ? '9+' : stats.pendingSongs}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">ผู้ใช้งานทั้งหมด</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalUsers} <span className="text-xs font-normal text-text-sub">คน</span></p>
        </div>

        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">เพลงทั้งหมดในระบบ</span>
            <Music className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalSongs} <span className="text-xs font-normal text-text-sub">เพลง</span></p>
        </div>

        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">ยอดฟังเพลงสะสม</span>
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalPlays?.toLocaleString()} <span className="text-xs font-normal text-text-sub">ครั้ง</span></p>
        </div>

        <div className="bg-dark-surface p-5 rounded-2xl border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">หมวดหมู่เพลง</span>
            <Tags className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalCategories} <span className="text-xs font-normal text-text-sub">หมวด</span></p>
        </div>
      </div>

      {/* Song Approval Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/pending-songs"
          className="relative bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl hover:bg-amber-950/30 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">รออนุมัติ</span>
            <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-amber-400">{stats.pendingSongs || 0}</p>
          <p className="text-[11px] text-amber-400/70 mt-1">เพลงรอการตรวจสอบ → คลิกเพื่อดำเนินการ</p>
          {stats.pendingSongs > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
          )}
        </Link>

        <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">อนุมัติแล้ว</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{stats.approvedSongs || 0}</p>
          <p className="text-[11px] text-emerald-400/70 mt-1">เพลงที่เผยแพร่สู่สาธารณะแล้ว</p>
        </div>

        <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">ไม่อนุมัติ</span>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-black text-red-400">{stats.rejectedSongs || 0}</p>
          <p className="text-[11px] text-red-400/70 mt-1">เพลงที่ถูกปฏิเสธการเผยแพร่</p>
        </div>
      </div>

      {/* กราฟสรุปสถิติ (Charts & Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* กราฟสัดส่วนผู้ใช้แยกตามบทบาท (User Role Breakdown) */}
        <div className="lg:col-span-5 bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-5">
          <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <span>สัดส่วนผู้ใช้งานแยกตามบทบาท</span>
            </h3>
            <span className="text-xs text-text-muted">รวม {stats.totalUsers} คน</span>
          </div>

          {/* Multi-segment Progress Bar สไตล์ Spotify Metric */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full bg-dark-card overflow-hidden flex">
              <div
                style={{ width: `${userPercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`ผู้ใช้ทั่วไป: ${stats.userRoleCounts?.user || 0} คน (${userPercent}%)`}
              />
              <div
                style={{ width: `${uploaderPercent}%` }}
                className="bg-orange-500 transition-all duration-500"
                title={`ผู้อัปโหลด: ${stats.userRoleCounts?.uploader || 0} คน (${uploaderPercent}%)`}
              />
              <div
                style={{ width: `${adminPercent}%` }}
                className="bg-red-500 transition-all duration-500"
                title={`ผู้ดูแลระบบ: ${stats.userRoleCounts?.admin || 0} คน (${adminPercent}%)`}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-borderSubtle">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-white">นักเรียน / นักศึกษา / บุคลากร (User)</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {stats.userRoleCounts?.user || 0} คน ({userPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-borderSubtle">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-white">ผู้อัปโหลดเพลง (Uploader)</span>
              </div>
              <span className="text-xs font-bold text-orange-400">
                {stats.userRoleCounts?.uploader || 0} คน ({uploaderPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-borderSubtle">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-white">ผู้ดูแลระบบ (Admin)</span>
              </div>
              <span className="text-xs font-bold text-red-400">
                {stats.userRoleCounts?.admin || 0} คน ({adminPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* กราฟการกระจายตัวของเพลงตามหมวดหมู่ (Category Bar Chart) */}
        <div className="lg:col-span-7 bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-5">
          <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Tags className="w-4 h-4 text-orange-500" />
              <span>การกระจายเพลงตามหมวดหมู่ (Category Distribution)</span>
            </h3>
            <Link to="/admin/categories" className="text-xs text-orange-400 hover:underline">
              จัดการหมวดหมู่
            </Link>
          </div>

          <div className="space-y-3">
            {stats.categoryDistribution?.map((cat) => {
              const barPercent = Math.round((cat.song_count / maxCategorySongs) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-xs">{cat.name}</span>
                    <span className="font-mono text-orange-400 font-bold">{cat.song_count} เพลง</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-dark-card overflow-hidden">
                    <div
                      style={{ width: `${barPercent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 เพลงยอดนิยมสูงสุดในระบบ (Top Popular Songs) */}
      <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border space-y-4">
        <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>5 อันดับเพลงยอดนิยมสูงสุดในระบบ</span>
          </h3>
          <Link to="/admin/songs" className="text-xs text-orange-400 hover:underline">
            ดูเพลงทั้งหมด
          </Link>
        </div>

        <div className="divide-y divide-dark-borderSubtle">
          {stats.topSongs?.map((song, index) => (
            <div key={song.id} className="py-3 flex items-center justify-between hover:bg-dark-card px-2 rounded-xl transition-colors">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <span className={`w-6 text-center text-sm font-black font-mono ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-text-muted'}`}>
                  #{index + 1}
                </span>
                <img
                  src={song.cover_path ? getFullMediaUrl(song.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'}
                  alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{song.title}</p>
                  <p className="text-xs text-text-sub truncate">{song.artist}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs text-text-muted">
                <span className="hidden sm:inline bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {song.category_name || 'ทั่วไป'}
                </span>
                <span className="font-mono text-white font-bold">{song.play_count?.toLocaleString()} ครั้ง</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
