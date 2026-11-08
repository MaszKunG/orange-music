import React from 'react';
import { 
  X, 
  Palette, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Check, 
  Sparkles, 
  SunMedium, 
  Moon, 
  Disc3 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeModal() {
  const {
    isThemeModalOpen,
    setIsThemeModalOpen,
    themeId,
    wallpaperId,
    selectTheme,
    selectWallpaper,
    overlayOpacity,
    setOverlayOpacity,
    resetToDefault,
    availableThemes,
    availableWallpapers,
    currentTheme
  } = useTheme();

  if (!isThemeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
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
                เลือกสีสันและบรรยากาศในแบบที่คุณชอบ บันทึกอัตโนมัติลงในเครื่องของคุณ
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
                    {/* Color Swatch Circle */}
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

          {/* 2. เลือกภาพพื้นหลัง Wallpaper */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>ภาพพื้นหลัง (Wallpaper & Mood)</span>
              </label>
              <span className="text-[11px] text-text-muted">
                0 Bytes โฮสต์ (โหลดผ่าน CDN คุณภาพสูง)
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

          {/* 3. แถบเลื่อนปรับความเข้ม Overlay สำหรับ Wallpaper รูปภาพ */}
          {availableWallpapers.find(w => w.id === wallpaperId)?.type === 'image' && (
            <div className="p-4 rounded-2xl bg-dark-card border border-dark-borderSubtle space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  <span>ความมืดของพื้นหลัง (Darkness Filter)</span>
                </span>
                <span className="font-mono font-bold text-orange-400">{overlayOpacity}%</span>
              </div>
              <p className="text-[11px] text-text-sub">
                ปรับความเข้มของฉากหลังเพื่อให้อ่านชื่อเพลงและตัวหนังสือได้อย่างสบายตา
              </p>
              <div className="pt-1">
                <input
                  type="range"
                  min="40"
                  max="95"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>สว่างขึ้น (เห็นรูปชัด)</span>
                <span>มืดลง (อ่านตัวหนังสือชัดเจน)</span>
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
