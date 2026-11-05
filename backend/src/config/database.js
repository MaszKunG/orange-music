const path = require('path');
require('dotenv').config();

let dbAsync;

// หากมีการตั้งค่า TURSO_DATABASE_URL จะเชื่อมต่อฐานข้อมูลบนคลาวด์ของ Turso (LibSQL)
if (process.env.TURSO_DATABASE_URL) {
  const { createClient } = require('@libsql/client');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('✅ เชื่อมต่อฐานข้อมูลคลาวด์ Turso (LibSQL) สำเร็จที่:', process.env.TURSO_DATABASE_URL);

  dbAsync = {
    isTurso: true,
    client: client,
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
} else {
  // หากไม่มีการระบุ URL คลาวด์ จะใช้ SQLite ภายในเครื่องตามปกติ
  const sqlite3 = require('sqlite3').verbose();

  const dbPath = process.env.DB_PATH 
    ? path.resolve(__dirname, '../../', process.env.DB_PATH) 
    : path.resolve(__dirname, '../../database.sqlite');

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ ไม่สามารถเชื่อมต่อกับฐานข้อมูล SQLite ได้:', err.message);
    } else {
      console.log('✅ เชื่อมต่อฐานข้อมูล SQLite สำเร็จที่:', dbPath);
    }
  });

  // เปิดการใช้งาน Foreign Keys ใน SQLite
  db.run('PRAGMA foreign_keys = ON');

  dbAsync = {
    isTurso: false,
    dbInstance: db,
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    },
    exec: (sql) => {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

module.exports = dbAsync;
