import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Grid, 
  ListMusic, 
  Heart, 
  UploadCloud, 
  Music, 
  ShieldCheck, 
  Users, 
  Tags, 
  Sparkles,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Sidebar() {
  const { isAuthenticated, isUploader, isAdmin } = useAuth();
  const [pendingSongs, setPendingSongs] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/stats')
        .then(res => { if (res.success) setPendingSongs(res.stats?.pendingSongs || 0); })
        .catch(() => {});
    }
  }, [isAdmin]);

  const navClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
        : 'text-text-sub hover:text-white hover:bg-dark-card'
    }`;

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-borderSubtle flex-col justify-between hidden md:flex h-[calc(100vh-65px)] overflow-y-auto p-4 space-y-6">
      <div className="space-y-6">
        {/* เมนูนำทางหลัก */}
        <div>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2">
            เมนูหลัก
          </p>
          <div className="space-y-1">
            <NavLink to="/" end className={navClass}>
              <Home className="w-4 h-4" />
              <span>หน้าแรก</span>
            </NavLink>
            <NavLink to="/search" className={navClass}>
              <Search className="w-4 h-4" />
              <span>ค้นหาเพลง</span>
            </NavLink>
            <NavLink to="/categories" className={navClass}>
              <Grid className="w-4 h-4" />
              <span>หมวดหมู่เพลง</span>
            </NavLink>
          </div>
        </div>

        {/* เมนูคลังเพลงส่วนตัว */}
        {isAuthenticated && (
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2">
              คลังเพลงของฉัน
            </p>
            <div className="space-y-1">
              <NavLink to="/my-playlists" className={navClass}>
                <ListMusic className="w-4 h-4" />
                <span>เพลย์ลิสต์ของฉัน</span>
              </NavLink>
              <NavLink to="/liked-songs" className={navClass}>
                <Heart className="w-4 h-4 text-orange-500" />
                <span>เพลงที่ถูกใจ</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* เมนูผู้อัปโหลดเพลง */}
        {isUploader && (
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider px-3 mb-2 flex items-center space-x-1">
              <span>สำหรับผู้อัปโหลดเพลง</span>
            </p>
            <div className="space-y-1">
              <NavLink to="/uploader/dashboard" className={navClass}>
                <Music className="w-4 h-4 text-orange-400" />
                <span>แดชบอร์ดของฉัน</span>
              </NavLink>
              <NavLink to="/uploader/upload" className={navClass}>
                <UploadCloud className="w-4 h-4 text-orange-400" />
                <span>อัปโหลดเพลงใหม่</span>
              </NavLink>
              <NavLink to="/uploader/my-songs" className={navClass}>
                <ListMusic className="w-4 h-4 text-orange-400" />
                <span>จัดการเพลงของฉัน</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* เมนูสำหรับผู้ดูแลระบบ (Admin) */}
        {isAdmin && (
          <div>
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider px-3 mb-2 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ผู้ดูแลระบบ</span>
            </p>
            <div className="space-y-1">
              <NavLink to="/admin/dashboard" className={navClass}>
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>รายงานสรุป & สถิติ</span>
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                <Users className="w-4 h-4 text-red-400" />
                <span>จัดการผู้ใช้งาน</span>
              </NavLink>
              <NavLink to="/admin/songs" className={navClass}>
                <Music className="w-4 h-4 text-red-400" />
                <span>จัดการเพลง</span>
              </NavLink>
              <NavLink to="/admin/pending-songs" className={navClass}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">เพลงรออนุมัติ</span>
                  </div>
                  {pendingSongs > 0 && (
                    <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ml-auto">
                      {pendingSongs}
                    </span>
                  )}
                </div>
              </NavLink>
              <NavLink to="/admin/categories" className={navClass}>
                <Tags className="w-4 h-4 text-red-400" />
                <span>จัดการหมวดหมู่</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* บล็อกประชาสัมพันธ์โครงการฟรีเพื่อการศึกษา */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
        <div className="flex items-center space-x-2 text-orange-400 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold">ฟรี 100% ไม่มีค่าบริการ</span>
        </div>
        <p className="text-[11px] text-text-sub leading-relaxed">
          สร้างสรรค์ขึ้นเพื่อสนับสนุนการศึกษาและพื้นที่แสดงผลงานของนักเรียน นักศึกษา
        </p>
      </div>
    </aside>
  );
}
