import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('orange_music_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      if (res.success) {
        localStorage.setItem('orange_music_token', res.token);
        setToken(res.token);
        setUser(res.user);
        showToast(res.message || 'เข้าสู่ระบบสำเร็จ', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      showToast(err.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.success) {
        localStorage.setItem('orange_music_token', res.token);
        setToken(res.token);
        setUser(res.user);
        showToast(res.message || 'สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ Orange Music!', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      showToast(err.message || 'การสมัครสมาชิกไม่สำเร็จ', 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('orange_music_token');
    setToken(null);
    setUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.success) {
        setUser(res.user);
        showToast('อัปเดตข้อมูลส่วนตัวสำเร็จ', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      showToast(err.message || 'อัปเดตข้อมูลไม่สำเร็จ', 'error');
      return { success: false, message: err.message };
    }
  };

  const role = user?.role || 'guest';
  const isAdmin = role === 'admin';
  const isUploader = role === 'uploader' || isAdmin;
  const isUser = role === 'user';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        role,
        isAdmin,
        isUploader,
        isUser,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
