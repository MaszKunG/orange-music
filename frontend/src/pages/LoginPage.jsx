import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrangeLogo from '../components/common/OrangeLogo';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) return;

    setSubmitting(true);
    const res = await login(usernameOrEmail, password);
    setSubmitting(false);

    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'uploader') {
        navigate('/uploader/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-dialog space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <OrangeLogo size={42} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">เข้าสู่ระบบ Orange Music</h1>
          <p className="text-xs text-text-sub">
            เพลิดเพลินกับเสียงดนตรีเพื่อการศึกษาได้ไม่จำกัด ฟรี 100%
          </p>
        </div>

        {/* ฟอร์มเข้าสู่ระบบ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
              ชื่อผู้ใช้ หรือ อีเมล
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ หรือ อีเมลของคุณ"
              required
              className="w-full bg-dark-card text-white text-sm px-4 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านของคุณ"
              required
              className="w-full bg-dark-card text-white text-sm px-4 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-text-sub pt-2 border-t border-dark-borderSubtle">
          ยังไม่มีบัญชีใช่หรือไม่?{' '}
          <Link to="/register" className="text-orange-400 font-bold hover:underline">
            สมัครสมาชิกฟรี
          </Link>
        </p>
      </div>
    </div>
  );
}
