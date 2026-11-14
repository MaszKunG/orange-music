import React from 'react';
import { Link } from 'react-router-dom';

export default function OrangeLogo({ className = 'h-9', showText = true, size = 34 }) {
  return (
    <Link to="/" className={`flex items-center space-x-2 group cursor-pointer flex-shrink-0 select-none ${className}`}>
      {/* SVG โลโก้ผลส้มผสมโน้ตดนตรี */}
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]"
        >
          {/* เงาและลำตัวผลส้ม */}
          <circle cx="50" cy="53" r="42" fill="url(#orange_grad)" />
          {/* แสงสะท้อนด้านบนของผลส้ม */}
          <ellipse cx="50" cy="42" rx="34" ry="16" fill="white" fillOpacity="0.2" />
          {/* ก้านผลส้ม */}
          <path
            d="M50 14 C50 6 56 3 64 3"
            stroke="#10B981"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* ใบไม้ผลส้ม */}
          <path
            d="M60 4 C68 2 73 8 68 15 C62 17 56 12 60 4 Z"
            fill="#10B981"
          />
          {/* สัญลักษณ์โน้ตดนตรีในผลส้ม */}
          <path
            d="M42 66 C38.5 66 36 63.5 36 60 C36 56.5 38.5 54 42 54 C45.5 54 48 56.5 48 60 L48 38 L65 33 L65 55 C61.5 55 59 52.5 59 49 C59 45.5 61.5 43 65 43 C68.5 43 71 45.5 71 49 L71 27 L42 33 L42 66 Z"
            fill="#FFFFFF"
          />
          <defs>
            <linearGradient id="orange_grad" x1="10" y1="15" x2="90" y2="95" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFA42B" />
              <stop offset="0.6" stopColor="#FF7A00" />
              <stop offset="1" stopColor="#E06900" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="font-bold tracking-tight text-base sm:text-lg text-white font-sans group-hover:text-orange-400 transition-colors">
              Orange<span className="text-orange-500">Music</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full border border-orange-500/30">
              ส้ม
            </span>
          </div>
          <span className="text-[10px] text-text-muted -mt-1 hidden sm:block">
            ฟังฟรีเพื่อการเรียนรู้
          </span>
        </div>
      )}
    </Link>
  );
}
