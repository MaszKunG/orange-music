import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Music, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrangeLogo from '../components/common/OrangeLogo';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user', // 'user' หรือ 'uploader'
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await register(formData);
    setSubmitting(false);

    if (res.success) {
      if (res.user.role === 'uploader') {
        navigate('/uploader/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-dialog space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <OrangeLogo size={42} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">สมัครสมาชิก Orange Music</h1>
          <p className="text-xs text-text-sub">
            ร่วมเป็นส่วนหนึ่งของแพลตฟอร์มดนตรีเพื่อการศึกษา ฟังและแชร์เพลงฟรี 100%
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* เลือกบทบาท */}
          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-2">
              เลือกบทบาทของคุณในระบบ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'user' })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.role === 'user'
                    ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500 shadow-glow-orange-sm'
                    : 'bg-dark-card border-dark-border hover:border-text-muted'
                }`}
              >
                <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">ผู้ใช้งานทั่วไป</span>
                </div>
                <p className="text-[11px] text-text-sub">
                  นักเรียน นักศึกษา บุคลากร ฟังเพลง สร้างเพลย์ลิสต์ได้ไม่อั้น
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'uploader' })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.role === 'uploader'
                    ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500 shadow-glow-orange-sm'
                    : 'bg-dark-card border-dark-border hover:border-text-muted'
                }`}
              >
                <div className="flex items-center space-x-2 text-orange-400 mb-1">
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-bold">ผู้อัปโหลดเพลง</span>
                </div>
                <p className="text-[11px] text-text-sub">
                  ศิลปิน ชมรมดนตรี เผยแพร่ผลงานเพลงและรูปปกสู่ผู้ฟัง
                </p>
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              * บัญชีผู้ดูแลระบบ (Admin) สงวนไว้สำหรับผู้ดูแลระบบส่วนกลางเท่านั้น
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="เช่น som_student"
              required
              minLength={3}
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1">
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="เช่น student@university.ac.th"
              required
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'กำลังสร้างบัญชี...' : 'ยืนยันการสมัครสมาชิก'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-text-sub">
          มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
          <Link to="/login" className="text-orange-400 font-bold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}
