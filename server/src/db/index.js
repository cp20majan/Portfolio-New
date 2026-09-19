import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'portfolio.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  side TEXT NOT NULL CHECK (side IN ('work','lab')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','signin')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  entry_number INTEGER,
  year TEXT,
  stack TEXT,
  model TEXT,
  seed TEXT,
  chapters_json TEXT NOT NULL DEFAULT '[]',
  video_status TEXT NOT NULL DEFAULT 'empty' CHECK (video_status IN ('empty','uploading','transcoding','ready','failed')),
  video_path TEXT,
  video_duration_seconds REAL,
  video_width INTEGER,
  video_height INTEGER,
  poster_path TEXT,
  poster_timestamp_seconds REAL,
  file_path TEXT,
  file_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS upload_jobs (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'uploading' CHECK (phase IN ('uploading','transcoding','finalising','done','failed')),
  pct INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export function touch(table, id) {
  db.prepare(`UPDATE ${table} SET updated_at = datetime('now') WHERE id = ?`).run(id);
}
