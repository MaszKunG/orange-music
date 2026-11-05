# 🍊 คู่มือการ Deploy ระบบ Orange Music สู่ Production (ฟรี 100%)

คู่มือนี้จะพาคุณนำเว็บไซต์ **Orange Music** ขึ้นใช้งานจริงบนอินเทอร์เน็ตผ่านบริการฟรีทั้งหมด **ไม่มีค่าบริการรายเดือน ($0/เดือน)**

---

## 🏗️ แผนภาพสถาปัตยกรรม (Cloud Architecture)

```
[ ผู้ใช้งานทั่วไป / นักเรียน / แอดมิน ]
               │
       (HTTPS / CDN ทั่วโลก)
               ▼
┌────────────────────────────────────────────────────────┐
│  🌐 FRONTEND (Vercel)                                   │
│  - โฮสต์ React (Vite) + Tailwind CSS                  │
│  - โดเมนฟรี: https://orange-music.vercel.app          │
│  - ฟรี 100GB Bandwidth/เดือน + SSL อัตโนมัติ          │
└────────────────────────────────────────────────────────┘
               │
          (REST API)
               ▼
┌────────────────────────────────────────────────────────┐
│  ⚙️ BACKEND API (Render.com)                            │
│  - โฮสต์ Node.js (Express)                             │
│  - โดเมนฟรี: https://orange-music-api.onrender.com     │
│  - ฟรี 750 ชั่วโมง/เดือน                               │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
      (LibSQL Protocol)          (S3 API / Media)
               ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│  🗄️ DATABASE (Turso)        │ │  ☁️ STORAGE (Cloudflare R2)
│  - Serverless LibSQL/SQLite │ │  - ไฟล์เพลง (.mp3)     │
│  - ข้อมูลไม่หายเมื่อรีสตาร์ท │ │  - รูปภาพหน้าปก (.jpg) │
│  - ฟรี 9GB (1 พันล้าน row)  │ │  - ฟรี 10GB + $0 แบนด์วิดท์
└─────────────────────────────┘ └────────────────────────┘
```

---

## 📌 ขั้นตอนที่ 1: สร้างฐานข้อมูลบน Turso (ฟรี 9GB)

Turso เป็นฐานข้อมูล LibSQL (SQLite บนคลาวด์) โค้ด Orange Music รองรับทันทีโดยไม่ต้องแก้ไขคำสั่ง SQL ใดๆ

1. เข้าเว็บไซต์ [https://turso.tech](https://turso.tech) และสมัครสมาชิก (Login with GitHub ได้)
2. ติดตั้ง Turso CLI บนเครื่อง หรือสร้าง Database ผ่านหน้าเว็บ Dashboard:
   - กดปุ่ม **"Create Database"**
   - ตั้งชื่อ เช่น `orange-music`
   - เลือก Location: แนะนำ **Singapore (sin)** เพื่อความเร็วสูงสุดในไทย
3. ในหน้า Database Details จะได้ค่า:
   - **Database URL:** ตัวอย่างเช่น `libsql://orange-music-yourname.turso.io`
4. ไปที่เมนู **Tokens** หรือกด **"Generate Token"**:
   - คัดลอก Auth Token เก็บไว้
5. *(เก็บค่า `TURSO_DATABASE_URL` และ `TURSO_AUTH_TOKEN` ไว้ใช้ในขั้นตอนที่ 3)*

---

## 📌 ขั้นตอนที่ 2: สร้างพื้นที่เก็บไฟล์บน Cloudflare R2 (ฟรี 10GB)

Cloudflare R2 เข้ากันได้กับ AWS S3 API 100% และ **ไม่มีการคิดค่า Bandwidth (Egress Fee)** เมื่อมีคนสตรีมเพลง

1. เข้าสู่ระบบที่ [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. ในแถบเมนูด้านซ้าย เลือก **R2 Object Storage**
3. กดปุ่ม **"Create Bucket"**:
   - ตั้งชื่อ Bucket เช่น: `orange-music`
   - เลือก Location: **Automatic** หรือ **Asia Pacific**
   - กด **Create Bucket**
4. เปิดการเข้าถึงสาธารณะ (Public Access):
   - เข้าไปใน Bucket `orange-music` -> แถบ **Settings**
   - ตรงส่วน **Public Access** -> กด **Allow Access** ในส่วน `R2.dev subdomain`
   - จะได้ URL สาธารณะ เช่น `https://pub-xxxxxxxxxxxx.r2.dev`
5. สร้าง API Credentials:
   - กลับมาที่หน้าหลัก R2 -> เมนูด้านขวาเลือก **"Manage R2 API Tokens"**
   - กด **"Create API Token"**
   - ตั้ง Permissions เป็น **Admin Read & Write**
   - กด Create Token จะได้:
     - **Account ID** (ดูที่หน้า R2 overview)
     - **Access Key ID**
     - **Secret Access Key**

---

## 📌 ขั้นตอนที่ 3: Deploy Backend บน Render.com (ฟรี 750 ชม.)

1. อัปโหลดโฟลเดอร์โปรเจกต์ขึ้น **GitHub** ของคุณ (สร้างเป็น New Repository เช่น `orange-music`)
2. สมัครและเข้าสู่ระบบที่ [https://render.com](https://render.com) (Login with GitHub)
3. กดปุ่ม **New +** -> เลือก **Web Service**
4. เลือกเชื่อมต่อกับ Repository GitHub ของคุณ:
   - **Name:** `orange-music-api`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Region:** `Singapore` (เร็วสุด)
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Instance Type:** `Free` ($0/month)
5. ในหัวข้อ **Environment Variables** ให้กด **Add Environment Variable** และกรอก:

| Key | Value ตัวอย่าง | คำอธิบาย |
|-----|----------------|----------|
| `NODE_ENV` | `production` | โหมดรัน |
| `JWT_SECRET` | `orange_music_prod_secret_2026_xyz` | รหัสลับความปลอดภัย JWT |
| `TURSO_DATABASE_URL` | `libsql://orange-music-xxx.turso.io` | จากขั้นตอนที่ 1 |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOi...` | จากขั้นตอนที่ 1 |
| `R2_ACCOUNT_ID` | `c2a6881...` | จากขั้นตอนที่ 2 |
| `R2_ACCESS_KEY_ID` | `48f8c0...` | จากขั้นตอนที่ 2 |
| `R2_SECRET_ACCESS_KEY` | `9b13fa...` | จากขั้นตอนที่ 2 |
| `R2_BUCKET_NAME` | `orange-music` | จากขั้นตอนที่ 2 |
| `R2_PUBLIC_URL` | `https://pub-xxxxxx.r2.dev` | จากขั้นตอนที่ 2 |

6. กด **Create Web Service** -> รอ Render ทำการ Build และ Deploy ประมาณ 2-3 นาที
7. เมื่อขึ้นสถานะ **Live** คุณจะได้ URL Backend เช่น:  
   👉 `https://orange-music-api.onrender.com` (บันทึก URL นี้ไว้ใช้ในขั้นตอนที่ 4)

---

## 📌 ขั้นตอนที่ 4: Deploy Frontend บน Vercel (ฟรี 100GB)

1. เข้าเว็บไซต์ [https://vercel.com](https://vercel.com) (Login with GitHub)
2. กดปุ่ม **Add New...** -> เลือก **Project**
3. เลือก Repository เดียวกันจาก GitHub
4. ตั้งค่าโปรเจกต์:
   - **Framework Preset:** `Vite` (ระบบจะเลือกให้อัตโนมัติ)
   - **Root Directory:** ให้กด Edit แล้วเลือกโฟลเดอร์ `frontend`
5. ในส่วน **Environment Variables**:
   - **Key:** `VITE_API_URL`
   - **Value:** URL ของ Render จากขั้นตอนที่ 3 เช่น `https://orange-music-api.onrender.com`
6. กดปุ่ม **Deploy**
7. รอประมาณ 30-45 วินาที เว็บไซต์จะออนไลน์ทันที! 🎉
   - จะได้ URL เช่น: `https://orange-music.vercel.app`

---

## 💡 บัญชีเริ่มต้นสำหรับเข้าสู่ระบบใน Production

เมื่อเซิร์ฟเวอร์เปิดขึ้นมาครั้งแรก ระบบ Seed Data จะสร้างบัญชีตัวอย่างให้พร้อมใช้งานทันที:

| บทบาท | Username | Email | รหัสผ่าน |
|-------|----------|-------|----------|
| 🔴 **ผู้ดูแลระบบ (Admin)** | `admin` | `admin@orangemusic.com` | `admin1234` |
| 🟠 **ผู้อัปโหลดเพลง (Uploader)** | `artist_som` | `uploader@orangemusic.com` | `uploader1234` |
| 🟢 **นักเรียน/นักศึกษา (User)** | `student_pop` | `student@orangemusic.com` | `user1234` |

---

## ⚙️ สรุปสิ่งที่ระบบเตรียมไว้ให้พร้อมแล้วในโค้ด

1. ✅ **Dual-Mode Database:** สลับอัตโนมัติระหว่าง Local SQLite และ Cloud Turso (LibSQL)
2. ✅ **Dual-Mode File Storage:** สลับอัตโนมัติระหว่าง Local Disk (`/uploads`) และ Cloudflare R2
3. ✅ **SPA Routing บน Vercel:** เพิ่มไฟล์ `frontend/vercel.json` ป้องกันหน้า 404 เวลา Refresh
4. ✅ **Dynamic API Endpoint:** รองรับ `VITE_API_URL` ใน `frontend/src/services/api.js`
5. ✅ **Seed & Migration:** เมื่อต่อ Turso จะสร้างตารางพร้อมข้อมูลเริ่มต้นให้อัตโนมัติในครั้งแรกที่รัน
