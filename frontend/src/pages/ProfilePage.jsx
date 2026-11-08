import React, { useState, useRef } from 'react';
import { User, Lock, Upload, Save, Mail, Camera, Sparkles, X, Check, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFullMediaUrl } from '../services/api';

const PRESET_AVATARS = [
  { id: 'orange-bot', name: 'ส้ม บอท', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=OrangeMaster' },
  { id: 'dj-music', name: 'ดีเจ มิวสิค', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MusicDJ' },
  { id: 'study-cat', name: 'แมวอ่านหนังสือ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CuteKitty' },
  { id: 'cyber-orange', name: 'ไซเบอร์ ส้ม', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberpunkOrange' },
  { id: 'astro-student', name: 'นักบินอวกาศ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstroOrange' },
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ฟังก์ชันย่อขนาดภาพผ่าน Canvas เพื่อให้การอัปโหลดเร็วที่สุด
  const compressImage = (file, maxWidth = 600, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('รูปภาพโปรไฟล์ต้องมีขนาดไม่เกิน 10MB');
      return;
    }

    try {
      // บีบอัดรูปภาพอัตโนมัติหากไฟล์ใหญ่กว่า 1MB เพื่อความรวดเร็ว
      const processedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
      setAvatarFile(processedFile);
      setAvatarPreview(URL.createObjectURL(processedFile));
      setSelectedPreset(null);
      setErrorMsg('');
    } catch {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setSelectedPreset(null);
      setErrorMsg('');
    }
  };

  const handleSelectPreset = (presetUrl) => {
    setSelectedPreset(presetUrl);
    setAvatarPreview(presetUrl);
    setAvatarFile(null);
    setErrorMsg('');
  };

  const handleCancelNewAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setSelectedPreset(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    } else if (selectedPreset) {
      formData.append('avatar', selectedPreset);
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
      setSelectedPreset(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  const currentAvatar = avatarPreview || getFullMediaUrl(user.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  const hasPendingAvatarChange = Boolean(avatarFile || selectedPreset);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 pt-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <User className="w-6 h-6 text-orange-500" />
          <span>แก้ไขข้อมูลส่วนตัว (Profile)</span>
        </h1>
        <p className="text-xs text-text-sub mt-1">
          อัปโหลดรูปภาพโปรไฟล์ใหม่และจัดการข้อมูลบัญชีของคุณ
        </p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 sm:p-8 shadow-dialog space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="pb-6 border-b border-dark-borderSubtle space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* รูปภาพวงกลม พร้อม Camera Badge */}
              <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={currentAvatar}
                  alt={user.full_name}
                  className="w-28 h-28 rounded-full object-cover border-2 border-orange-500 shadow-glow-orange bg-dark-card transition-transform group-hover:scale-105"
                />
                
                {/* Overlay ตอน Hover */}
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-bold">
                  <Upload className="w-5 h-5 mb-1 text-orange-400" />
                  <span>เปลี่ยนรูป</span>
                </div>

                {/* Badge ไอคอนกล้องด้านล่างขวา (เห็นชัดเจนตลอดเวลา) */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-lg border-2 border-dark-surface hover:bg-orange-400 transition-colors">
                  <Camera className="w-4 h-4 fill-black stroke-black" />
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* คำอธิบายและปุ่มเลือกรูป */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <span>{user.full_name}</span>
                    {user.username.toLowerCase() === 'masz' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-bold">👑 Masz</span>
                    )}
                  </h3>
                  <p className="text-xs text-text-sub">@{user.username}</p>
                </div>

                {/* ปุ่มเลือกรูปและแจ้งเตือนสถานะรูป */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold inline-flex items-center space-x-1.5 shadow-glow-orange-sm transition-transform active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปภาพใหม่</span>
                  </button>

                  {hasPendingAvatarChange && (
                    <button
                      type="button"
                      onClick={handleCancelNewAvatar}
                      className="px-3 py-2 rounded-xl bg-dark-card hover:bg-dark-border text-text-muted hover:text-white text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ยกเลิกรูปที่เลือก</span>
                    </button>
                  )}
                </div>

                {hasPendingAvatarChange ? (
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center sm:justify-start space-x-1 pt-0.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>เลือกรูปภาพใหม่แล้ว (กดปุ่ม "บันทึกการเปลี่ยนแปลง" ด้านล่างเพื่อใช้งาน)</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-text-muted">
                    รองรับไฟล์ภาพ JPG, PNG, WEBP (ขนาดไม่เกิน 10MB)
                  </p>
                )}
              </div>
            </div>

            {/* แถบตัวเลือก Preset Avatar สำเร็จรูป */}
            <div className="pt-2">
              <p className="text-xs font-bold text-text-sub mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>หรือเลือกรูปการ์ตูนเท่ๆ ในระบบ:</span>
              </p>
              <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`relative p-1 rounded-full border-2 transition-all transform hover:scale-110 flex-shrink-0 ${
                      avatarPreview === preset.url ? 'border-orange-500 ring-2 ring-orange-400/50 scale-105' : 'border-dark-border hover:border-orange-400'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-10 h-10 rounded-full bg-dark-card object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ฟอร์มแก้ไขข้อมูลทั่วไป */}
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

            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                อีเมล
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-dark-card/60 text-text-muted text-sm px-4 py-2.5 rounded-xl border border-dark-borderSubtle cursor-not-allowed"
              />
              <span className="text-[10px] text-text-muted mt-1 block">อีเมลไม่สามารถแก้ไขได้โดยตรง</span>
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
            className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 transform hover:scale-[1.01] active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
