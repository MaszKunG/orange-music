import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import OrangeLogo from '../components/common/OrangeLogo';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ขั้นตอน: 1 = ระบุอีเมล, 2 = กรอกรหัส OTP, 3 = ตั้งรหัสผ่านใหม่, 4 = สำเร็จ
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // Countdown timer สำหรับขอรหัส OTP ซ้ำ
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ขั้นตอนที่ 1: ส่งคำขอ OTP ไปยังอีเมล
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      showToast('กรุณากรอกอีเมลของคุณ', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      showToast(res.message || 'ส่งรหัสยืนยัน OTP ไปที่อีเมลเรียบร้อยแล้ว', 'success');
      setStep(2);
      setCountdown(60); // เริ่มนับถอยหลัง 60 วินาที
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการส่งรหัสยืนยัน', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ขอส่งรหัส OTP ซ้ำ
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    await handleRequestOtp();
  };

  // ขั้นตอนที่ 2: ตรวจสอบความถูกต้องของรหัส OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      showToast('กรุณากรอกรหัสยืนยัน 6 หลักให้ครบถ้วน', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      showToast(res.message || 'รหัสยืนยันถูกต้อง กรุณาตั้งรหัสผ่านใหม่', 'success');
      setStep(3);
    } catch (err) {
      showToast(err.message || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ขั้นตอนที่ 3: ตั้งรหัสผ่านใหม่
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      });
      showToast(res.message || 'รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!', 'success');
      setStep(4);
    } catch (err) {
      showToast(err.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-dialog space-y-6">
        
        {/* หัวเรื่อง / โลโก้ */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <OrangeLogo size={42} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === 1 && 'ลืมรหัสผ่าน'}
            {step === 2 && 'ยืนยันรหัส OTP'}
            {step === 3 && 'ตั้งรหัสผ่านใหม่'}
            {step === 4 && 'เปลี่ยนรหัสผ่านสำเร็จ'}
          </h1>
          <p className="text-xs text-text-sub">
            {step === 1 && 'กรอกอีเมลของคุณเพื่อรับรหัสยืนยันอัตโนมัติในการรีเซ็ตรหัสผ่าน'}
            {step === 2 && `ระบบได้ส่งรหัส 6 หลักไปยังอีเมล ${email}`}
            {step === 3 && 'กำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบ (อย่างน้อย 6 ตัวอักษร)'}
            {step === 4 && 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'}
          </p>
        </div>

        {/* Indicator แสดงขั้นตอน */}
        {step < 4 && (
          <div className="flex items-center justify-center space-x-2 py-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-10 bg-orange-500' : 'w-6 bg-dark-border'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-10 bg-orange-500' : 'w-6 bg-dark-border'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-10 bg-orange-500' : 'w-6 bg-dark-border'}`} />
          </div>
        )}

        {/* ขั้นตอนที่ 1: กรอกอีเมล */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                อีเมลที่ลงทะเบียนไว้
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full bg-dark-card text-white text-sm pl-11 pr-4 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
                />
                <Mail className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังส่งรหัสยืนยัน...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>ส่งรหัสยืนยัน OTP</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-text-sub hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
              </Link>
            </div>
          </form>
        )}

        {/* ขั้นตอนที่ 2: กรอกรหัส OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {devOtp && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-xs text-orange-400 text-center">
                <span className="font-bold">รหัสทดสอบสำหรับนักพัฒนา:</span>{' '}
                <span className="font-mono font-black text-sm tracking-widest text-white ml-1">{devOtp}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-text-sub uppercase">
                  รหัสยืนยัน (OTP 6 หลัก)
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-orange-400 hover:underline"
                >
                  เปลี่ยนอีเมล
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full bg-dark-card text-white text-center font-mono text-2xl tracking-[0.5em] pl-10 pr-4 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
                />
                <KeyRound className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5 text-center">
                รหัสยืนยันมีอายุ 15 นาที
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>ยืนยันรหัส OTP</span>
                </>
              )}
            </button>

            {/* ปุ่มขอรหัสใหม่ */}
            <div className="pt-2 text-center">
              {countdown > 0 ? (
                <p className="text-xs text-text-muted">
                  สามารถขอรหัสใหม่ได้ในอีก <span className="text-orange-400 font-bold">{countdown}</span> วินาที
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 hover:underline transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ส่งรหัสใหม่อีกครั้ง</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* ขั้นตอนที่ 3: ตั้งรหัสผ่านใหม่ */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                  required
                  autoFocus
                  minLength={6}
                  className="w-full bg-dark-card text-white text-sm pl-11 pr-11 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
                />
                <Lock className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกยืนยันรหัสผ่านใหม่อีกครั้ง"
                  required
                  minLength={6}
                  className="w-full bg-dark-card text-white text-sm pl-11 pr-11 py-3 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none transition-colors"
                />
                <Lock className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 6 || !confirmPassword}
              className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกรหัสผ่าน...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>บันทึกรหัสผ่านใหม่</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ขั้นตอนที่ 4: เปลี่ยนรหัสผ่านสำเร็จ */}
        {step === 4 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว!</h3>
              <p className="text-xs text-text-sub">
                รหัสผ่านบัญชีของคุณได้รับการอัปเดตอย่างปลอดภัยแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>เข้าสู่ระบบตอนนี้</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
