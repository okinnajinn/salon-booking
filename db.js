const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, 'database.sqlite');


const db = new sqlite3.Database(dbPath, (err) => {
  
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS masters (
    id TEXT PRIMARY KEY, login TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    name TEXT, sms_enabled INTEGER DEFAULT 1, smsru_api_key TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT
  )`, (err) => { if (err) console.error(err); });

  

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, sort_order INTEGER DEFAULT 0
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY, category_id TEXT, name TEXT NOT NULL,
    short_description TEXT, full_description TEXT, purpose TEXT,
    duration_min INTEGER NOT NULL, price REAL NOT NULL,
    images TEXT DEFAULT '[]', is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL,
    notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS time_slots (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, start_time TEXT NOT NULL,
    end_time TEXT NOT NULL, status TEXT DEFAULT 'free', service_id TEXT,
    UNIQUE(date, start_time)
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL, service_id TEXT NOT NULL,
    slot_id TEXT NOT NULL, price_at_moment REAL NOT NULL,
    status TEXT DEFAULT 'waiting', created_at TEXT DEFAULT (datetime('now'))
  )`, (err) => { if (err) console.error(err); });

  db.run(`CREATE TABLE IF NOT EXISTS sms_log (
    id TEXT PRIMARY KEY, appointment_id TEXT NOT NULL,
    type TEXT NOT NULL, status TEXT DEFAULT 'pending', sent_at TEXT
  )`, (err) => { if (err) console.error(err); });

  db.run(`INSERT OR IGNORE INTO masters (id, login, password_hash, name) VALUES (?, ?, ?, ?)`,
    [randomUUID(), 'admin', '$2b$10$PBrdAUtEWAKKPZfmkuWlSOgMLH7dbPDN5tNDk6hiPOuWLKzJTEgbW', 'Мастер']);

  db.run(`INSERT OR IGNORE INTO system_settings (id, key, value) VALUES (?, ?, ?)`,
    [randomUUID(), 'sms_mode', 'platform']);
  db.run(`INSERT OR IGNORE INTO system_settings (id, key, value) VALUES (?, ?, ?)`,
    [randomUUID(), 'smsru_platform_api_key', '']);

  console.log('DB init done');
});

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const lower = sql.trim().toLowerCase();
    if (lower.startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

module.exports = { query, db };