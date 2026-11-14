import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import PersistentPlayer from './components/player/PersistentPlayer';
import WallpaperBackground from './components/theme/WallpaperBackground';
import ThemeModal from './components/theme/ThemeModal';

import LandingHomePage from './pages/LandingHomePage';
import SearchPage from './pages/SearchPage';
import CategoriesPage from './pages/CategoriesPage';
import SongDetailPage from './pages/SongDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyPlaylistsPage from './pages/MyPlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import LikedSongsPage from './pages/LikedSongsPage';

import UploaderDashboard from './pages/uploader/UploaderDashboard';
import UploadSongPage from './pages/uploader/UploadSongPage';
import MySongsPage from './pages/uploader/MySongsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageSongsPage from './pages/admin/ManageSongsPage';
import ManageCategoriesPage from './pages/admin/ManageCategoriesPage';
import PendingSongsPage from './pages/admin/PendingSongsPage';

// Route Guard: ต้องเข้าสู่ระบบ
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center text-text-muted">
        กำลังโหลด...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role) && !isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-red-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-xs text-text-sub">หน้านี้สำหรับสิทธิ์ {allowedRoles.join(', ')} เท่านั้น</p>
      </div>
    );
  }

  return children;
}

function MainLayout() {
  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-orange-500 selection:text-black relative w-full overflow-x-hidden max-w-[100vw]">
      {/* Background Wallpaper System */}
      <WallpaperBackground />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Navbar />

        <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
          <Sidebar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-60px)] pb-32 sm:pb-24 w-full min-w-0">
            <Routes>
              {/* สาธารณะ */}
              <Route path="/" element={<LandingHomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/songs/:id" element={<SongDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ผู้ใช้ทั่วไป (ต้องล็อกอิน) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-playlists"
                element={
                  <ProtectedRoute>
                    <MyPlaylistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-playlists/:id"
                element={
                  <ProtectedRoute>
                    <PlaylistDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/liked-songs"
                element={
                  <ProtectedRoute>
                    <LikedSongsPage />
                  </ProtectedRoute>
                }
              />

              {/* ผู้อัปโหลด (Uploader หรือ Admin) */}
              <Route
                path="/uploader/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['uploader', 'admin']}>
                    <UploaderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/uploader/upload"
                element={
                  <ProtectedRoute allowedRoles={['uploader', 'admin']}>
                    <UploadSongPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/uploader/my-songs"
                element={
                  <ProtectedRoute allowedRoles={['uploader', 'admin']}>
                    <MySongsPage />
                  </ProtectedRoute>
                }
              />

              {/* แอดมิน (Admin) */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/songs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageSongsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageCategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pending-songs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PendingSongsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="text-center py-24 space-y-4">
                    <span className="text-6xl">🍊</span>
                    <h2 className="text-2xl font-bold text-white">404 - ไม่พบหน้าที่คุณต้องการ</h2>
                    <p className="text-xs text-text-sub">กรุณาตรวจสอบ URL หรือกลับไปยังหน้าแรก</p>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>

        {/* Persistent Bottom Audio Player */}
        <PersistentPlayer />
      </div>

      {/* Theme & Wallpaper Selector Modal */}
      <ThemeModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PlayerProvider>
            <ThemeProvider>
              <MainLayout />
            </ThemeProvider>
          </PlayerProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
