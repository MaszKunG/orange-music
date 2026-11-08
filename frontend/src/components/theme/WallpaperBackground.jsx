import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { usePlayer } from '../../context/PlayerContext';
import { getFullMediaUrl, DEFAULT_COVER } from '../../services/api';

export default function WallpaperBackground() {
  const { currentWallpaper, overlayOpacity, currentTheme } = useTheme();
  const { currentSong } = usePlayer();

  const isAmoled = currentWallpaper.id === 'amoled';
  const isImage = currentWallpaper.type === 'image';
  const isDynamic = currentWallpaper.id === 'dynamic-blur';

  // รูปปกเพลงสำหรับ Dynamic Album Art
  const dynamicCoverUrl = currentSong?.cover_path 
    ? getFullMediaUrl(currentSong.cover_path) 
    : DEFAULT_COVER;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-700">
      {/* 1. กรณี AMOLED Pure Black */}
      {isAmoled && (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* 2. กรณี Dynamic Album Art Blur (สไตล์ Apple Music) */}
      {isDynamic && (
        <>
          <div className="absolute inset-0 bg-dark-base" />
          <div 
            className="absolute -inset-24 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${dynamicCoverUrl})`,
            }}
          />
          <div 
            className="absolute inset-0 bg-gradient-to-t from-dark-base via-dark-base/80 to-transparent" 
          />
        </>
      )}

      {/* 3. กรณี Wallpaper รูปภาพ (Lo-Fi Cafe, Starry Night, Aurora, etc.) */}
      {isImage && (
        <>
          <img
            src={currentWallpaper.url}
            alt={currentWallpaper.name}
            className="absolute inset-0 w-full h-full object-cover filter blur-[1px] scale-105 transition-all duration-700"
          />
          {/* Dark Overlay ปรับความเข้มได้ เพื่อให้อ่านตัวหนังสือและปุ่มกดได้ชัดเจน 100% */}
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}

      {/* 4. กรณี Default Glow (แสงเรืองตามสี Theme) */}
      {!isAmoled && !isImage && !isDynamic && (
        <>
          {/* Subtle radial ambient glow based on current theme accent */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] opacity-20 transition-all duration-700"
            style={{ backgroundColor: currentTheme.accent }}
          />
        </>
      )}
    </div>
  );
}
