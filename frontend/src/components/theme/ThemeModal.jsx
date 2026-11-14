import React, { useState, useRef } from 'react';
import { 
  X, 
  Palette, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Moon, 
  Disc3,
  UploadCloud,
  Link2,
  Trash2,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function ThemeModal() {
  const {
    isThemeModalOpen,
    setIsThemeModalOpen,
    themeId,
    wallpaperId,
    selectTheme,
    selectWallpaper,
    customWallpaperObj,
    saveCustomWallpaper,
    removeCustomWallpaper,
    overlayOpacity,
    setOverlayOpacity,
    resetToDefault,
    availableThemes,
    availableWallpapers,
    currentTheme,
    currentWallpaper
  } = useTheme();

  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [urlError, setUrlError] = useState('');

  if (!isThemeModalOpen) return null;

  // จัดการอัปโหลดไฟล์ภาพ / GIF จากเครื่อง
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบขนาดไม่เกิน 25MB (เผื่อ GIF ความละเอียดสูง)
    if (file.size > 25 * 1024 * 1024) {
      showToast('ขนาดไฟล์ต้องไม่เกิน 25MB', 'error');
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('รองรับเฉพาะไฟล์ภาพ .jpg, .png, .gif, .webp เท่านั้น', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === 'string') {
          await saveCustomWallpaper(dataUrl);
          showToast(file.type === 'image/gif' ? 'เพิ่มภาพเคลื่อนไหว GIF สำเร็จ!' : 'เพิ่มภาพพื้นหลังสำเร็จ!', 'success');
        }
      } catch (err) {
        showToast('ไม่สามารถบันทึกภาพพื้นหลังได้', 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // จัดการใช้ภาพ / GIF จาก URL
  const handleApplyUrl = async (e) => {
    e.preventDefault();
    setUrlError('');
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUrlError('กรุณาวาง URL ของรูปภาพหรือ GIF');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('URL ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    try {
      await saveCustomWallpaper(trimmed);
      setCustomUrlInput('');
      showToast('นำเข้าภาพพื้นหลังเรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('ไม่สามารถนำเข้าภาพพื้นหลังได้', 'error');
    }
  };

  // ลบภาพพื้นหลังที่เพิ่มเอง
  const handleDeleteCustom = async (e) => {
    e.stopPropagation();
    await removeCustomWallpaper();
    showToast('ลบภาพพื้นหลังของคุณเรียบร้อยแล้ว', 'info');
  };

  const isCurrentWallpaperImage = currentWallpaper.type === 'image' || currentWallpaper.id === 'custom';
  const minOpacity = 30;
  const maxOpacity = 95;
  const sliderPercentage = ((overlayOpacity - minOpacity) / (maxOpacity - minOpacity)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-dark-surface border border-dark-border w-full max-w-2xl rounded-3xl shadow-dialog overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-borderSubtle bg-dark-card/50">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-colors"
              style={{ 
                backgroundColor: `${currentTheme.accent}20`,
                border: `1px solid ${currentTheme.accent}40`,
                color: currentTheme.accent
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>ปรับแต่งธีม & พื้นหลัง</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                  Customization
                </span>
              </h2>
              <p className="text-xs text-text-sub mt-0.5">
                เลือกสีสันและบรรยากาศในแบบที่คุณชอบ สามารถอัปโหลดรูปหรือ GIF ขยับได้เอง
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="w-9 h-9 rounded-full bg-dark-card hover:bg-dark-elevated text-text-muted hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* 1. เลือกสี Theme Accent */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>โทนสีหลัก (Accent Color)</span>
              </label>
              <span className="text-xs text-text-muted font-medium">
                สีปัจจุบัน: <span className="font-bold text-white">{currentTheme.name.split(' (')[0]}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {availableThemes.map((theme) => {
                const isSelected = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => selectTheme(theme.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center space-x-3 group ${
                      isSelected
                        ? 'bg-dark-card border-white/40 ring-2 ring-offset-2 ring-offset-dark-surface shadow-md'
                        : 'bg-dark-card/60 hover:bg-dark-card border-dark-borderSubtle hover:border-dark-border'
                    }`}
                    style={isSelected ? { ringColor: theme.accent } : {}}
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: theme.accent,
                        boxShadow: `0 0 10px ${theme.accent}60`
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {theme.name.split(' (')[0]}
                      </p>
                      <p className="text-[10px] text-text-sub truncate">
                        {theme.emoji} {theme.id}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ส่วนเพิ่มภาพพื้นหลังหรือ GIF ของตัวเอง (Custom Wallpaper) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                <FileImage className="w-3.5 h-3.5 text-orange-500" />
                <span>เพิ่มพื้นหลังของคุณเอง (รูปภาพ & GIF เคลื่อนไหว)</span>
              </label>
              <span className="text-[11px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                รองรับภาพ GIF ขยับได้
              </span>
            </div>

            {/* แสดงการ์ดภาพที่อัปโหลดไว้แล้ว (ถ้ามี) */}
            {customWallpaperObj && (
              <div 
                onClick={() => selectWallpaper('custom')}
                className={`relative rounded-2xl overflow-hidden border p-4 cursor-pointer transition-all ${
                  wallpaperId === 'custom'
                    ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-glow-orange-sm bg-dark-card'
                    : 'border-dark-borderSubtle hover:border-dark-border bg-dark-card/60'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 relative border border-white/10 shadow-md">
                    <img 
                      src={customWallpaperObj.url} 
                      alt="Custom preview"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-white truncate">พื้นหลังที่คุณกำหนดเอง</p>
                      {wallpaperId === 'custom' && (
                        <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.2 rounded-full">
                          กำลังใช้งาน
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-sub truncate mt-0.5">
                      {customWallpaperObj.url.startsWith('data:') ? 'ไฟล์จากในเครื่องของคุณ' : customWallpaperObj.url}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCustom}
                    title="ลบภาพพื้นหลังนี้"
                    className="p-2 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* แผงอัปโหลดและใส่ URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ปุ่มอัปโหลดไฟล์จากเครื่อง */}
              <div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="custom-wallpaper-file"
                />
                <label
                  htmlFor="custom-wallpaper-file"
                  className="w-full h-full p-4 rounded-2xl border-2 border-dashed border-dark-border hover:border-orange-500/60 bg-dark-card/40 hover:bg-dark-card/80 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 min-h-[96px]"
                >
                  <UploadCloud className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-bold text-white">
                    {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ / GIF จากเครื่อง'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    รองรับ JPG, PNG, GIF, WebP สูงสุด 25MB
                  </span>
                </label>
              </div>

              {/* ใส่ URL จากเว็บ เช่น Giphy, Imgur */}
              <form onSubmit={handleApplyUrl} className="p-3.5 rounded-2xl border border-dark-borderSubtle bg-dark-card/40 flex flex-col justify-between space-y-2">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Link2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>หรือวางลิงก์รูปภาพ / GIF (URL)</span>
                </span>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setUrlError('');
                    }}
                    placeholder="https://...รูปภาพหรือ .gif"
                    className="flex-1 bg-dark-surface text-white text-xs px-3 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold transition-all flex-shrink-0"
                  >
                    นำไปใช้
                  </button>
                </div>
                {urlError && (
                  <p className="text-[10px] text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{urlError}</span>
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* 3. เลือกภาพพื้นหลังพรีเซ็ต (Wallpaper Presets) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>ภาพพื้นหลังสำเร็จรูป (Preset Wallpapers)</span>
              </label>
              <span className="text-[11px] text-text-muted">
                ภาพบรรยากาศสวยงามพร้อมใช้งาน
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableWallpapers.map((wp) => {
                const isSelected = wallpaperId === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => selectWallpaper(wp.id)}
                    className={`relative rounded-2xl overflow-hidden border text-left transition-all duration-300 group p-3 flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-glow-orange-sm'
                        : 'border-dark-borderSubtle hover:border-dark-border bg-dark-card/60'
                    }`}
                  >
                    {/* Background Preview */}
                    {wp.type === 'image' && (
                      <div className="absolute inset-0">
                        <img 
                          src={wp.url} 
                          alt={wp.name} 
                          className="w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                      </div>
                    )}

                    {wp.type === 'color' && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <Moon className="w-8 h-8 text-white/20" />
                      </div>
                    )}

                    {wp.type === 'dynamic' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-purple-600/30 to-black flex items-center justify-center">
                        <Disc3 className="w-8 h-8 text-orange-400 animate-spin-slow opacity-60" />
                      </div>
                    )}

                    {wp.type === 'default' && (
                      <div className="absolute inset-0 bg-dark-base flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-orange-500/20 blur-xl" />
                      </div>
                    )}

                    {/* Card Content Overlay */}
                    <div className="relative z-10 flex items-start justify-between w-full">
                      <span className="text-xs font-black text-white px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                        {wp.name}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 mt-auto">
                      <p className="text-[11px] text-white/80 line-clamp-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {wp.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. แถบเลื่อนปรับความเข้ม Darkness Filter แบบใหม่ ชัดเจน มีขีดบอก % และปุ่มลัด */}
          {isCurrentWallpaperImage && (
            <div className="p-5 rounded-2xl bg-dark-card border border-dark-borderSubtle space-y-4 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  <span>ความมืดของพื้นหลัง (Darkness Filter)</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm">
                  {overlayOpacity}% ความมืด
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-text-sub leading-relaxed">
                ปรับความเข้มของฉากหลังเพื่อให้อ่านชื่อเพลง ตัวหนังสือ และปุ่มกดได้อย่างสบายตา (ยิ่ง % สูง ยิ่งอ่านง่าย)
              </p>

              {/* Slider Track พร้อมแถบสีไฮไลท์ตาม % */}
              <div className="space-y-3 pt-1">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={minOpacity}
                    max={maxOpacity}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="custom-slider w-full cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #FF7A00 0%, #FF9A3C ${sliderPercentage}%, #2A2A2A ${sliderPercentage}%, #2A2A2A 100%)`
                    }}
                  />
                </div>

                {/* ขีดสเกลบอกเปอร์เซ็นต์ (Tick marks) กดเลือกได้เลย */}
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-text-muted px-1 select-none">
                  {[30, 45, 60, 75, 85, 95].map((val) => {
                    const isCurrent = Math.abs(overlayOpacity - val) <= 3;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOverlayOpacity(val)}
                        className={`flex flex-col items-center group transition-colors ${
                          isCurrent ? 'text-orange-400 font-bold scale-105' : 'hover:text-white'
                        }`}
                      >
                        <span className={`w-0.5 rounded-full mb-1 transition-all ${
                          isCurrent ? 'bg-orange-500 h-3.5 shadow-glow-orange-sm' : 'bg-dark-border group-hover:bg-text-sub h-2'
                        }`} />
                        <span>{val}%</span>
                      </button>
                    );
                  })}
                </div>

                {/* ปุ่มลัดเลือกระดับความมืดยอดนิยม */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-text-muted mr-1 font-medium">ระดับแนะนำ:</span>
                  {[
                    { label: 'สว่างชัด (45%)', val: 45 },
                    { label: 'สมดุล (70%)', val: 70 },
                    { label: 'อ่านง่าย แนะนำ (85%)', val: 85 },
                    { label: 'มืดสนิท (95%)', val: 95 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setOverlayOpacity(p.val)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                        overlayOpacity === p.val
                          ? 'bg-orange-500/25 text-orange-400 border-orange-500/60 shadow-sm font-bold'
                          : 'bg-dark-surface hover:bg-dark-elevated text-text-sub border-dark-border hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-borderSubtle bg-dark-card/30">
          <button
            onClick={resetToDefault}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-text-sub hover:text-white hover:bg-dark-elevated transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all transform hover:scale-105 active:scale-95"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
