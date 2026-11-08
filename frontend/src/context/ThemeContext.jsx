import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePlayer } from './PlayerContext';

export const THEME_COLORS = [
  {
    id: 'orange',
    name: 'ส้มคลาสสิก (Classic Orange)',
    accent: '#FF7A00',
    hover: '#FF9A3C',
    light: '#FFA42B',
    dark: '#E06900',
    rgb: '255 122 0',
    hoverRgb: '255 154 60',
    darkRgb: '224 105 0',
    glow: 'rgba(255, 122, 0, 0.45)',
    glowSm: 'rgba(255, 122, 0, 0.35)',
    emoji: '🍊'
  },
  {
    id: 'purple',
    name: 'ม่วงนีออน (Cyberpunk Neon)',
    accent: '#A855F7',
    hover: '#C084FC',
    light: '#D8B4FE',
    dark: '#9333EA',
    rgb: '168 85 247',
    hoverRgb: '192 132 252',
    darkRgb: '147 51 234',
    glow: 'rgba(168, 85, 247, 0.45)',
    glowSm: 'rgba(168, 85, 247, 0.35)',
    emoji: '🟣'
  },
  {
    id: 'emerald',
    name: 'เขียวมรกต (Spotify Emerald)',
    accent: '#10B981',
    hover: '#34D399',
    light: '#6EE7B7',
    dark: '#059669',
    rgb: '16 185 129',
    hoverRgb: '52 211 153',
    darkRgb: '5 150 105',
    glow: 'rgba(16, 185, 129, 0.45)',
    glowSm: 'rgba(16, 185, 129, 0.35)',
    emoji: '🟢'
  },
  {
    id: 'blue',
    name: 'ฟ้าโอเชียน (Ocean Blue)',
    accent: '#0EA5E9',
    hover: '#38BDF8',
    light: '#7DD3FC',
    dark: '#0284C7',
    rgb: '14 165 233',
    hoverRgb: '56 189 248',
    darkRgb: '2 132 199',
    glow: 'rgba(14, 165, 233, 0.45)',
    glowSm: 'rgba(14, 165, 233, 0.35)',
    emoji: '🔵'
  },
  {
    id: 'pink',
    name: 'ชมพูซากุระ (Sunset Sakura)',
    accent: '#EC4899',
    hover: '#F472B6',
    light: '#F9A8D4',
    dark: '#DB2777',
    rgb: '236 72 153',
    hoverRgb: '244 114 182',
    darkRgb: '219 39 119',
    glow: 'rgba(236, 72, 153, 0.45)',
    glowSm: 'rgba(236, 72, 153, 0.35)',
    emoji: '🌸'
  },
  {
    id: 'amber',
    name: 'ทองอำพัน (Golden Sunset)',
    accent: '#F59E0B',
    hover: '#FBBF24',
    light: '#FCD34D',
    dark: '#D97706',
    rgb: '245 158 11',
    hoverRgb: '251 191 36',
    darkRgb: '217 119 6',
    glow: 'rgba(245, 158, 11, 0.45)',
    glowSm: 'rgba(245, 158, 11, 0.35)',
    emoji: '🟡'
  },
  {
    id: 'cyan',
    name: 'ไซแอนออโรร่า (Aurora Cyan)',
    accent: '#06B6D4',
    hover: '#22D3EE',
    light: '#67E8F9',
    dark: '#0891B2',
    rgb: '6 182 212',
    hoverRgb: '34 211 238',
    darkRgb: '8 145 178',
    glow: 'rgba(6, 182, 212, 0.45)',
    glowSm: 'rgba(6, 182, 212, 0.35)',
    emoji: '🔷'
  }
];

export const WALLPAPERS = [
  {
    id: 'default',
    name: 'Dark Ambient (ค่าเริ่มต้น)',
    type: 'default',
    previewColor: '#121212',
    description: 'พื้นหลังมืดสไตล์สตูดิโอ มีแสงนุ่มนวล'
  },
  {
    id: 'amoled',
    name: 'AMOLED Pure Black',
    type: 'color',
    previewColor: '#000000',
    description: 'ดำสนิท 100% สบายตา ประหยัดพลังงาน'
  },
  {
    id: 'dynamic-blur',
    name: 'แสงเรืองตามปกเพลง (Dynamic Album Glow)',
    type: 'dynamic',
    previewColor: 'linear-gradient(135deg, #FF7A00 0%, #A855F7 100%)',
    description: 'พื้นหลังเรืองแสงเปลี่ยนสีตามปกเพลงที่กำลังเล่นอยู่'
  },
  {
    id: 'lofi-cafe',
    name: 'Lo-Fi Study Cafe',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&auto=format&fit=crop&q=80',
    description: 'บรรยากาศคาเฟ่อ่านหนังสือโทนอบอุ่น'
  },
  {
    id: 'starry-night',
    name: 'ค่ำคืนดวงดาว (Starry Cosmos)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1920&auto=format&fit=crop&q=80',
    description: 'ท้องฟ้าระยิบระยับยามค่ำคืน ผ่อนคลายก่อนนอน'
  },
  {
    id: 'aurora',
    name: 'แสงเหนือออโรร่า (Aurora Wave)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&auto=format&fit=crop&q=80',
    description: 'คลื่นแสงเหนือพลิ้วไหวสีเขียวมรกต'
  },
  {
    id: 'cyberpunk',
    name: 'นีออนไซเบอร์พังก์ (Cyberpunk Rain)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&auto=format&fit=crop&q=80',
    description: 'มหานครยามค่ำคืนใต้แสงไฟนีออน'
  }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('orange_music_theme') || 'orange';
  });

  const [wallpaperId, setWallpaperId] = useState(() => {
    return localStorage.getItem('orange_music_wallpaper') || 'default';
  });

  const [overlayOpacity, setOverlayOpacity] = useState(() => {
    return Number(localStorage.getItem('orange_music_overlay_opacity')) || 85;
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const currentTheme = THEME_COLORS.find(t => t.id === themeId) || THEME_COLORS[0];
  const currentWallpaper = WALLPAPERS.find(w => w.id === wallpaperId) || WALLPAPERS[0];

  // อัปเดต CSS Variables บน documentElement เมื่อเปลี่ยนสี Theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-accent-hover', currentTheme.hover);
    root.style.setProperty('--theme-accent-light', currentTheme.light);
    root.style.setProperty('--theme-accent-dark', currentTheme.dark);
    root.style.setProperty('--theme-accent-rgb', currentTheme.rgb);
    root.style.setProperty('--theme-accent-hover-rgb', currentTheme.hoverRgb);
    root.style.setProperty('--theme-accent-dark-rgb', currentTheme.darkRgb);
    root.style.setProperty('--theme-accent-glow', currentTheme.glow);
    root.style.setProperty('--theme-accent-glow-sm', currentTheme.glowSm);

    localStorage.setItem('orange_music_theme', currentTheme.id);
  }, [currentTheme]);

  // บันทึก Wallpaper เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('orange_music_wallpaper', currentWallpaper.id);
  }, [currentWallpaper]);

  // บันทึกความเข้ม Overlay
  useEffect(() => {
    localStorage.setItem('orange_music_overlay_opacity', overlayOpacity);
  }, [overlayOpacity]);

  const selectTheme = (id) => {
    setThemeId(id);
  };

  const selectWallpaper = (id) => {
    setWallpaperId(id);
  };

  const resetToDefault = () => {
    setThemeId('orange');
    setWallpaperId('default');
    setOverlayOpacity(85);
  };

  return (
    <ThemeContext.Provider value={{
      themeId,
      wallpaperId,
      currentTheme,
      currentWallpaper,
      overlayOpacity,
      setOverlayOpacity,
      selectTheme,
      selectWallpaper,
      resetToDefault,
      isThemeModalOpen,
      setIsThemeModalOpen,
      availableThemes: THEME_COLORS,
      availableWallpapers: WALLPAPERS
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
