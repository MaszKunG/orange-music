import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, User, LogOut, ShieldAlert, UploadCloud, Heart, ListMusic,
  ChevronDown, Music, Bell, Clock, CheckCircle2, XCircle, Palette
} from 'lucide-react';
import OrangeLogo from './OrangeLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api, getFullMediaUrl } from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isUploader } = useAuth();
  const { setIsThemeModalOpen, currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingSongs, setPendingSongs] = useState(0);
  const navigate = useNavigate();
  const notifRef = useRef(null);

  // Load notifications (uploader + admin)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isUploader || isAdmin) {
      loadNotifications();
    }
    if (isAdmin) {
      loadPendingCount();
    }
  }, [isAuthenticated, isUploader, isAdmin]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) setNotifications(res.notifications || []);
    } catch {}
  };

  const loadPendingCount = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.success) setPendingSongs(res.stats?.pendingSongs || 0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">แอดมิน</span>;
      case 'uploader':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">ผู้อัปโหลด</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">นักเรียน/นักศึกษา</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-base/90 backdrop-blur-md border-b border-dark-borderSubtle px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* ฝั่งซ้าย */}
        <div className="flex items-center space-x-6">
          <OrangeLogo size={36} />
          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/" className="text-sm font-medium text-text-sub hover:text-white px-3.5 py-1.5 rounded-full hover:bg-dark-surface transition-colors">หน้าแรก</Link>
            <Link to="/categories" className="text-sm font-medium text-text-sub hover:text-white px-3.5 py-1.5 rounded-full hover:bg-dark-surface transition-colors">หมวดหมู่เพลง</Link>
            {isAuthenticated && (
              <>
                <Link to="/my-playlists" className="text-sm font-medium text-text-sub hover:text-white px-3.5 py-1.5 rounded-full hover:bg-dark-surface transition-colors">เพลย์ลิสต์</Link>
                <Link to="/liked-songs" className="text-sm font-medium text-text-sub hover:text-white px-3.5 py-1.5 rounded-full hover:bg-dark-surface transition-colors flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span>ถูกใจ</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* ตรงกลาง: ช่องค้นหา */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเพลง, ศิลปิน, หมวดหมู่..."
              className="w-full bg-dark-card text-white text-sm placeholder-text-muted pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-orange-500/70 focus:bg-dark-surface focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all shadow-inset-pill"
            />
            <Search className="w-4 h-4 text-text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* ฝั่งขวา */}
        <div className="flex items-center space-x-2">
          {isUploader && (
            <Link
              to="/uploader/upload"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-dark-card hover:bg-dark-elevated border border-orange-500/40 px-3.5 py-2 rounded-full transition-all"
            >
              <UploadCloud className="w-4 h-4 text-orange-500" />
              <span>อัปโหลดเพลง</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin/pending-songs"
              className="relative hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-red-400 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 px-3.5 py-2 rounded-full transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>แอดมิน</span>
              {pendingSongs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-black text-black flex items-center justify-center">
                  {pendingSongs > 9 ? '9+' : pendingSongs}
                </span>
              )}
            </Link>
          )}

          {/* ปุ่มปรับแต่งธีม & พื้นหลัง (Theme & Wallpaper Switcher) */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            title="ปรับแต่งธีม & พื้นหลัง"
            className="w-9 h-9 rounded-full bg-dark-card hover:bg-dark-elevated border border-dark-border flex items-center justify-center transition-all hover:scale-105 group relative"
          >
            <Palette className="w-4 h-4 text-orange-400 group-hover:rotate-12 transition-transform" />
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-dark-surface shadow-sm"
              style={{ backgroundColor: currentTheme.accent }}
            />
          </button>

          {/* Notification Bell */}
          {isAuthenticated && (isUploader || isAdmin) && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }}
                className="relative w-9 h-9 rounded-full bg-dark-card hover:bg-dark-elevated border border-dark-border flex items-center justify-center transition-colors"
              >
                <Bell className="w-4 h-4 text-text-sub" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-surface border border-dark-border rounded-2xl shadow-dialog z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-dark-borderSubtle">
                    <h4 className="text-sm font-bold text-white">การแจ้งเตือน</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] text-orange-400 hover:underline">
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-dark-borderSubtle">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-text-muted">ไม่มีการแจ้งเตือน</div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`px-4 py-3 cursor-pointer hover:bg-dark-card transition-colors ${!n.is_read ? 'bg-orange-500/5' : ''}`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className={`mt-0.5 flex-shrink-0 ${n.type === 'approved' ? 'text-emerald-400' : n.type === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                              {n.type === 'approved'
                                ? <CheckCircle2 className="w-4 h-4" />
                                : n.type === 'rejected'
                                  ? <XCircle className="w-4 h-4" />
                                  : <Clock className="w-4 h-4" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-white font-semibold' : 'text-text-sub'}`}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-text-muted mt-0.5">
                                {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.is_read && <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-dark-card hover:bg-dark-surface border border-dark-border py-1 px-2.5 rounded-full transition-colors"
              >
                <img
                  src={getFullMediaUrl(user.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.full_name}
                  className="w-7 h-7 rounded-full object-cover bg-dark-elevated"
                />
                <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden md:inline">
                  {user.full_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-sub" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-dark-surface border border-dark-border rounded-2xl shadow-dialog py-2 z-50 animate-scale-up"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-dark-borderSubtle">
                    <p className="text-xs font-medium text-text-sub">เข้าสู่ระบบในชื่อ</p>
                    <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                  </div>

                  <div className="py-1">
                    <Link to="/profile" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-text-sub hover:text-white hover:bg-dark-card transition-colors">
                      <User className="w-4 h-4" /><span>แก้ไขโปรไฟล์</span>
                    </Link>
                    <Link to="/my-playlists" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-text-sub hover:text-white hover:bg-dark-card transition-colors">
                      <ListMusic className="w-4 h-4" /><span>เพลย์ลิสต์ของฉัน</span>
                    </Link>
                    <Link to="/liked-songs" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-text-sub hover:text-white hover:bg-dark-card transition-colors">
                      <Heart className="w-4 h-4 text-orange-500" /><span>เพลงที่ถูกใจ</span>
                    </Link>

                    {isUploader && (
                      <>
                        <div className="my-1 border-t border-dark-borderSubtle" />
                        <Link to="/uploader/dashboard" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-orange-400 hover:bg-dark-card transition-colors">
                          <Music className="w-4 h-4" /><span>แดชบอร์ดผู้อัปโหลด</span>
                        </Link>
                        <Link to="/uploader/my-songs" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-text-sub hover:text-white hover:bg-dark-card transition-colors">
                          <UploadCloud className="w-4 h-4" /><span>จัดการเพลงของฉัน</span>
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-dark-borderSubtle" />
                        <Link to="/admin/dashboard" className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-dark-card transition-colors">
                          <ShieldAlert className="w-4 h-4" /><span>แผงควบคุมผู้ดูแลระบบ</span>
                        </Link>
                        <Link to="/admin/pending-songs" className="flex items-center justify-between px-4 py-2 text-xs font-medium text-amber-400 hover:bg-dark-card transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <Clock className="w-4 h-4" /><span>เพลงรออนุมัติ</span>
                          </div>
                          {pendingSongs > 0 && (
                            <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingSongs}</span>
                          )}
                        </Link>
                      </>
                    )}

                    <div className="my-1 border-t border-dark-borderSubtle" />
                    <button onClick={logout} className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/20 transition-colors text-left">
                      <LogOut className="w-4 h-4" /><span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/register" className="text-xs font-bold uppercase tracking-wider text-white hover:text-orange-400 px-4 py-2 rounded-full border border-dark-border hover:border-text-muted transition-colors">
                สมัครสมาชิก
              </Link>
              <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-black bg-orange-500 hover:bg-orange-400 px-5 py-2 rounded-full shadow-glow-orange-sm transition-all transform hover:scale-105">
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
