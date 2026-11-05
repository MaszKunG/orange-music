import React, { useState } from 'react';
import { User, Lock, Upload, Save, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFullMediaUrl } from '../services/api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('รูปภาพโปรไฟล์ต้องมีขนาดไม่เกิน 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
      if (!currentPassword) {
        setErrorMsg('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนแปลง');
        return;
      }
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('full_name', fullName.trim());
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    if (newPassword) {
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);
    }

    const res = await updateProfile(formData);
    setSubmitting(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
    }
  };

  if (!user) return null;

  const currentAvatar = avatarPreview || getFullMediaUrl(user.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 pt-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <User className="w-6 h-6 text-orange-500" />
          <span>แก้ไขข้อมูลส่วนตัว (Profile)</span>
        </h1>
        <p className="text-xs text-text-sub mt-1">
          จัดการข้อมูลบัญชีผู้ใช้และรหัสผ่านของคุณ
        </p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 sm:p-8 shadow-dialog space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-dark-borderSubtle">
            <div className="relative group">
              <img
                src={currentAvatar}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-orange-500 shadow-glow-orange-sm bg-dark-card"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px]"
              >
                <Upload className="w-4 h-4 mb-0.5" />
                <span>เปลี่ยนรูป</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-white">{user.full_name}</h3>
              <p className="text-xs text-text-sub">@{user.username}</p>
              <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1 text-xs text-text-muted">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  <span>{user.email}</span>
                </span>
                <span>•</span>
                <span className="capitalize font-bold text-orange-400">บทบาท: {user.role}</span>
              </div>
            </div>
          </div>

          {/* ฟอร์มแก้ไขข้อมูล */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                ชื่อ - นามสกุล
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* ส่วนเปลี่ยนรหัสผ่าน */}
            <div className="pt-4 border-t border-dark-borderSubtle space-y-3">
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-orange-500" />
                <span>เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>
              </p>

              <div>
                <label className="block text-xs text-text-sub mb-1">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยัน"
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-sub mb-1">รหัสผ่านใหม่ (6 ตัวขึ้นไป)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่"
                    className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-sub mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                    className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
