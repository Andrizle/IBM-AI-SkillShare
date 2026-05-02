const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.SQLITE_PATH || './data/medications.db';
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      dosage     TEXT NOT NULL,
      times      TEXT NOT NULL,
      notes      TEXT,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id             TEXT PRIMARY KEY,
      medication_id  TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      scheduled_time TEXT NOT NULL,
      taken_at       TEXT,
      date           TEXT NOT NULL,
      status         TEXT NOT NULL CHECK(status IN ('taken', 'missed', 'pending')),
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id              TEXT PRIMARY KEY,
      summary         TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      ran_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('Database initialised');
}

module.exports = { db, initDb };
