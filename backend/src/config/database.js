const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config();

// กำหนด URL ของฐานข้อมูล
// 1) หากมี TURSO_DATABASE_URL ให้เชื่อมต่อไปยังคลาวด์
// 2) หากไม่มี ให้ใช้ไฟล์ SQLite ในเครื่องผ่าน LibSQL (หมดปัญหาเรื่อง C++ Native / GLIBC บน Linux)
const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

let dbUrl;
if (isTurso) {
  dbUrl = process.env.TURSO_DATABASE_URL;
  console.log('✅ เชื่อมต่อฐานข้อมูลคลาวด์ Turso (LibSQL) ที่:', dbUrl);
} else {
  const localDbPath = process.env.DB_PATH 
    ? path.resolve(__dirname, '../../', process.env.DB_PATH) 
    : path.resolve(__dirname, '../../database.sqlite');
  
  // แปลง path เป็น file: url สำหรับ LibSQL
  dbUrl = `file:${localDbPath.replace(/\\/g, '/')}`;
  console.log('✅ เชื่อมต่อฐานข้อมูล SQLite (LibSQL) สำเร็จที่:', localDbPath);
}

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// เปิดการใช้งาน Foreign Keys ใน SQLite
client.execute('PRAGMA foreign_keys = ON').catch(() => {});

const dbAsync = {
  isTurso,
  client,
  get: async (sql, params = []) => {
    const res = await client.execute({ sql, args: params });
    return res.rows && res.rows.length > 0 ? res.rows[0] : null;
  },
  all: async (sql, params = []) => {
    const res = await client.execute({ sql, args: params });
    return res.rows || [];
  },
  run: async (sql, params = []) => {
    const res = await client.execute({ sql, args: params });
    return {
      id: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null 
        ? Number(res.lastInsertRowid) 
        : 0,
      changes: res.rowsAffected || 0
    };
  },
  exec: async (sql) => {
    if (typeof client.executeMultiple === 'function') {
      await client.executeMultiple(sql);
    } else {
      await client.execute(sql);
    }
  }
};

module.exports = dbAsync;
