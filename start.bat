@echo off
chcp 65001 >nul
title Orange Music Launcher
echo ========================================================
echo 🍊 กำลังเริ่มต้นระบบ Orange Music (ส้ม)...
echo ========================================================

set "PROJECT_DIR=%~dp0"
set "NODE_DIR=%PROJECT_DIR%.tools\node"

if exist "%NODE_DIR%\node.exe" (
    set "PATH=%NODE_DIR%;%PATH%"
    echo ✅ พบ Node.js ใน .tools\node
) else (
    echo ⚠️ ใช้ Node.js จากระบบส่วนกลาง
)

echo.
echo [1/2] เริ่มต้น Backend Server (Port 5000)...
start "Orange Music - Backend API" cmd /k "cd /d "%PROJECT_DIR%backend" && set "PATH=%NODE_DIR%;%%PATH%%" && node src/server.js"

echo [2/2] เริ่มต้น Frontend (Vite Port 5173)...
start "Orange Music - Frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && set "PATH=%NODE_DIR%;%%PATH%%" && npm run dev"

echo.
echo ⏳ กำลังรอให้เซิร์ฟเวอร์พร้อมใช้งาน (ประมาณ 3 วินาที)...
timeout /t 3 /nobreak >nul

echo ========================================================
echo 🎉 Orange Music เริ่มต้นเรียบร้อยแล้ว!
echo 🌐 Frontend : http://localhost:5173
echo ⚙️  Backend  : http://localhost:5000/api
echo.
echo * หมายเหตุ: ห้ามปิดหน้าต่างสีดำที่เปิดขึ้นมาขณะใช้งาน
echo ========================================================

start http://localhost:5173
