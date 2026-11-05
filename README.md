# 🍊 Orange Music ("ส้ม")

> **เว็บไซต์ฟังเพลงออนไลน์ฟรี 100% ไม่มีค่าบริการ สำหรับนักเรียน นักศึกษา และบุคลากรทางการศึกษา**  
> ออกแบบด้วยแนวคิด **Dark Immersive Design System** ตามสเปกใน [`orange.md`](./orange.md) ผสานสีส้มสดใส (#FF7A00, #FF9A3C) รูปทรงเรขาคณิตแบบ Pill-and-Circle (ปุ่มมน 9999px / วงกลม 50%) และ Persistent Bottom Music Player

---

## 📸 จุดเด่นและคุณสมบัติหลัก

- 🎵 **ฟรีทั้งหมด 100% (Free Forever)**: ไม่มีโฆษณาคั่น ไม่มีการเรียกเก็บค่าบริการใดๆ ออกแบบมาเพื่อการเรียนรู้และการแสดงความสามารถของนักเรียน นักศึกษา
- 🎨 **Design System Inspired by Spotify**: ธีมมืดระดับลึก (Content-First Darkness `#121212`, `#181818`) ขับเน้นภาพปกและปุ่มแอคชันสีส้มเรืองแสง (Vibrant Orange Glow)
- 🎧 **Persistent Music Player**: เครื่องเล่นเพลงติดอยู่ด้านล่างตลอดเวลา เล่นเพลงต่อเนื่องไม่มีสะดุดแม้จะเปลี่ยนหน้า ควบคุมได้ครบครัน (เล่น/หยุด, ข้าม, ย้อน, สุ่ม, วนซ้ำ, แถบเวลาลากได้, ปรับระดับเสียง, ดูเนื้อเพลง, คิวเพลง)
- 🛡️ **Role-Based Access Control (3 บทบาท)**: รองรับสิทธิ์ผู้ใช้ 3 ระดับ พร้อมระบบความปลอดภัยระดับสากล ป้องกัน SQL Injection, XSS และจำกัดขนาดไฟล์อัปโหลด
- ⚡ **Full-Stack Performance**: ขับเคลื่อนด้วย React (Vite) + Tailwind CSS + Node.js Express + SQLite

---

## 👥 บัญชีทดลองใช้งานในระบบ (Demo Accounts)

ระบบได้เตรียมข้อมูล Seed Data เริ่มต้นไว้ให้พร้อมใช้งานทันที:

| บทบาท (Role) | บัญชีผู้ใช้ / อีเมล | รหัสผ่าน | สิทธิ์และการใช้งาน |
|---|---|---|---|
| 👑 **ผู้ดูแลระบบ (Admin)** | `admin@orange.music` | `admin1234` | ดูแดชบอร์ดสรุปสถิติพร้อมกราฟ, จัดการผู้ใช้ทุกบทบาท, ลบเพลงไม่เหมาะสม, จัดการหมวดหมู่เพลง |
| 🎧 **ผู้อัปโหลดเพลง (Uploader)** | `uploader@orange.music` | `uploader1234` | อัปโหลดเพลงใหม่พร้อมไฟล์เสียงและปก, จัดการ/แก้ไข/ลบเพลงของตนเอง, ดูสถิติเพลงตนเอง |
| 🎓 **ผู้ใช้ทั่วไป (Student/User)** | `student@orange.music` | `user1234` | ค้นหาเพลง/ศิลปิน/หมวดหมู่, ฟังเพลง, จัดการเพลย์ลิสต์ส่วนตัว, กดถูกใจเพลง, แก้ไขโปรไฟล์ |

> 💡 **หมายเหตุ**: ในหน้า เข้าสู่ระบบ (`/login`) มีปุ่ม **"คลิกเดียวเข้าสู่ระบบเพื่อทดลองใช้งาน"** ให้กดทดสอบได้ทันทีโดยไม่ต้องพิมพ์รหัสผ่าน

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์

### วิธีที่ 1: ดับเบิ้ลคลิกเดียวผ่านไฟล์ `start.bat` (สำหรับ Windows)
เพียงดับเบิ้ลคลิกที่ไฟล์:
```text
start.bat
```
ระบบจะเปิดทั้ง Backend API (Port 5000) และ Frontend (Port 5173) พร้อมเปิดบราวเซอร์ให้โดยอัตโนมัติ!

---

### วิธีที่ 2: รันแยกทีละส่วนผ่าน Terminal

#### 1. รัน Backend API
```bash
cd backend
npm install
npm start
```
*Backend API จะทำงานที่: `http://localhost:5000`*

#### 2. รัน Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend จะทำงานที่: `http://localhost:5173`*

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
d:\orangemusic.md\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # การเชื่อมต่อ SQLite และ Async Helpers
│   │   ├── controllers/
│   │   │   ├── authController.js     # สมัครสมาชิก, เข้าสู่ระบบ, โปรไฟล์
│   │   │   ├── songController.js     # ค้นหาเพลง, ดึงรายละเอียด, อัปโหลด, แก้ไข, ลบ
│   │   │   ├── playlistController.js # จัดการเพลย์ลิสต์ และเพลงในเพลย์ลิสต์
│   │   │   ├── categoryController.js # หมวดหมู่เพลง
│   │   │   ├── likeController.js     # ถูกใจเพลง (Likes)
│   │   │   └── adminController.js    # รายงานสถิติ, จัดการผู้ใช้, จัดการเพลง
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js     # ตรวจสอบ JWT Token และ RBAC สิทธิ์ผู้ใช้
│   │   │   ├── uploadMiddleware.js   # Multer กรองไฟล์เสียง <= 20MB, รูปปก <= 2MB
│   │   │   └── errorMiddleware.js    # จัดการ Error เป็นภาษาไทย
│   │   ├── routes/                   # API Routes ทั้งหมด
│   │   ├── seed/
│   │   │   └── seedData.js           # โครงสร้างตาราง DB และ Mock Data
│   │   └── server.js                 # Entry point ของ Backend API
│   ├── uploads/
│   │   ├── audio/                    # เก็บไฟล์เสียง (.mp3, .wav, .m4a)
│   │   └── covers/                   # เก็บรูปภาพปกเพลง (.jpg, .png)
│   ├── .env.example
│   ├── database.sqlite               # ไฟล์ฐานข้อมูล SQLite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # OrangeLogo, Navbar, Sidebar, ConfirmModal
│   │   │   ├── player/               # PersistentPlayer (Bottom Player)
│   │   │   ├── song/                 # SongCard
│   │   │   └── playlist/             # AddToPlaylistModal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Global Auth State
│   │   │   ├── PlayerContext.jsx     # Global Persistent Audio State
│   │   │   └── ToastContext.jsx      # ภาษาไทย Notification Toasts
│   │   ├── pages/
│   │   │   ├── LandingHomePage.jsx   # หน้าแรกและ Landing Page สไตล์ Spotify Glow
│   │   │   ├── SearchPage.jsx        # ค้นหาแยกแท็บ (เพลง/ศิลปิน/หมวดหมู่)
│   │   │   ├── CategoriesPage.jsx    # หน้าหมวดหมู่เพลง
│   │   │   ├── SongDetailPage.jsx    # หน้ารายละเอียดเพลง & เนื้อร้อง
│   │   │   ├── LoginPage.jsx         # หน้าเข้าสู่ระบบ
│   │   │   ├── RegisterPage.jsx      # หน้าสมัครสมาชิก (User / Uploader)
│   │   │   ├── ProfilePage.jsx       # แก้ไขข้อมูลส่วนตัว
│   │   │   ├── MyPlaylistsPage.jsx   # เพลย์ลิสต์ของฉัน
│   │   │   ├── PlaylistDetailPage.jsx# รายละเอียดเพลงในเพลย์ลิสต์
│   │   │   ├── LikedSongsPage.jsx    # หน้าเพลงที่ถูกใจ
│   │   │   ├── uploader/             # แดชบอร์ด, อัปโหลดเพลง, จัดการเพลงตนเอง
│   │   │   └── admin/                # สถิติรายงานกราฟ, จัดการผู้ใช้, จัดการเพลง, จัดการหมวดหมู่
│   │   ├── services/
│   │   │   └── api.js                # Fetch Wrapper & Base URLs
│   │   ├── App.jsx                   # Routes Setup & Guards
│   │   └── index.css                 # Tailwind Directives & Custom Theme
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── start.bat                         # สคริปต์รันระบบด้วยคลิกเดียว
├── README.md
└── orange.md                         # Design System Reference
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

```sql
-- 1. ผู้ใช้งาน (users)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'uploader', 'user')) NOT NULL DEFAULT 'user',
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. หมวดหมู่เพลง (categories)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. บทเพลง (songs)
CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  category_id INTEGER,
  uploader_id INTEGER,
  description TEXT,
  lyrics TEXT,
  audio_path TEXT NOT NULL,
  cover_path TEXT,
  play_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. เพลย์ลิสต์ (playlists)
CREATE TABLE playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. เพลงในเพลย์ลิสต์ (playlist_songs)
CREATE TABLE playlist_songs (
  playlist_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- 6. การกดถูกใจ (likes)
CREATE TABLE likes (
  user_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

---

## 🔌 สรุป REST API Endpoints

### การตรวจสอบสิทธิ์ (Authentication)
- `POST /api/auth/register` - สมัครสมาชิก (เฉพาะ role: `user` หรือ `uploader`)
- `POST /api/auth/login` - เข้าสู่ระบบ (คืน JWT token + ข้อมูลผู้ใช้)
- `GET /api/auth/me` - ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
- `PUT /api/auth/profile` - แก้ไขข้อมูลตนเอง (ชื่อ, Avatar, รหัสผ่าน)

### บทเพลง (Songs)
- `GET /api/songs` - ดึงรายการเพลงทั้งหมด (query: `search`, `category_id`, `sort`, `uploader_id`)
- `GET /api/songs/:id` - ดึงรายละเอียดเพลงเดี่ยว และเพิ่มยอด `play_count`
- `POST /api/songs` - อัปโหลดเพลงใหม่ (เฉพาะสิทธิ์ `uploader` หรือ `admin`, Audio $\le$ 20MB, Cover $\le$ 2MB)
- `PUT /api/songs/:id` - แก้ไขเพลง (เจ้าของเพลง หรือ Admin เท่านั้น)
- `DELETE /api/songs/:id` - ลบเพลง (เจ้าของเพลง หรือ Admin เท่านั้น)

### หมวดหมู่เพลง (Categories)
- `GET /api/categories` - ดูรายการหมวดหมู่เพลงทั้งหมด
- `POST /api/categories` - เพิ่มหมวดหมู่ใหม่ (Admin เท่านั้น)
- `PUT /api/categories/:id` - แก้ไขหมวดหมู่ (Admin เท่านั้น)
- `DELETE /api/categories/:id` - ลบหมวดหมู่ (Admin เท่านั้น)

### เพลย์ลิสต์ (Playlists)
- `GET /api/playlists` - ดูเพลย์ลิสต์ของผู้ใช้ปัจจุบัน
- `POST /api/playlists` - สร้างเพลย์ลิสต์ใหม่
- `GET /api/playlists/:id` - ดูรายละเอียดและเพลงในเพลย์ลิสต์
- `PUT /api/playlists/:id` - เปลี่ยนชื่อเพลย์ลิสต์
- `DELETE /api/playlists/:id` - ลบเพลย์ลิสต์
- `POST /api/playlists/:id/songs` - เพิ่มเพลงลงเพลย์ลิสต์
- `DELETE /api/playlists/:id/songs/:songId` - ลบเพลงออกจากเพลย์ลิสต์

### การกดถูกใจ (Likes)
- `GET /api/likes` - รายการเพลงที่ตนเองกดถูกใจ
- `POST /api/likes/:songId` - สลับสถานะถูกใจ (Like / Unlike)

### ผู้ดูแลระบบ (Admin)
- `GET /api/admin/stats` - รายงานสรุปข้อมูลสถิติ กราฟสัดส่วนผู้ใช้ และเพลงยอดนิยม
- `GET /api/admin/users` - รายชื่อผู้ใช้ทั้งหมด (ค้นหา, กรองตามบทบาท)
- `POST /api/admin/users` - เพิ่มผู้ใช้งานใหม่ (กำหนดบทบาท admin, uploader, user ได้)
- `PUT /api/admin/users/:id` - แก้ไขข้อมูลและเปลี่ยนบทบาทผู้ใช้
- `DELETE /api/admin/users/:id` - ลบผู้ใช้งาน (ห้ามลบตนเอง)
- `GET /api/admin/songs` - รายการเพลงทั้งหมดเพื่อตรวจสอบ
- `DELETE /api/admin/songs/:id` - ลบเพลงที่ไม่เหมาะสม

---

## 🔒 มาตรการความปลอดภัยและคุณภาพ (Security & Quality)

1. **Role-Based Access Control (RBAC)**: ตรวจสอบสิทธิ์สองชั้น ทั้งฝั่ง Frontend (Route Guards) และ Backend (Middleware `requireRole`)
2. **Data & File Validation**: ตรวจสอบ MIME type และขนาดไฟล์อย่างเข้มงวด (เสียง $\le$ 20MB, รูปภาพ $\le$ 2MB)
3. **Password Security**: เข้ารหัสรหัสผ่านด้วย `bcrypt` 10 salt rounds
4. **Prevention of Admin Self-Registration**: ไม่อนุญาตให้ผู้ใช้สมัครสมาชิกเป็นบทบาท Admin ด้วยตนเอง บัญชีแอดมินสร้างผ่าน Seed หรือ Admin Dashboard เท่านั้น
5. **Confirmation Dialogs**: มีหน้าต่าง Modal ยืนยันภาษาไทยทุกครั้งก่อนลบข้อมูลสำคัญ เพื่อป้องกันความผิดพลาด
