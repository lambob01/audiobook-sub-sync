import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'syncspeak.db');

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode=WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS prefs (
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS token_versions (
    user_id TEXT PRIMARY KEY,
    version INTEGER NOT NULL DEFAULT 0
  )`);

  return db;
}

export function getPref(userId: string, key: string): string | null {
  const row = getDb().prepare('SELECT value FROM prefs WHERE user_id = ? AND key = ?').get(userId, key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setPref(userId: string, key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO prefs (user_id, key, value) VALUES (?, ?, ?)').run(userId, key, value);
}

export function getTokenVersion(userId: string): number {
  const row = getDb().prepare('SELECT version FROM token_versions WHERE user_id = ?').get(userId) as { version: number } | undefined;
  return row?.version ?? 0;
}

export function setTokenVersion(userId: string, version: number): void {
  getDb().prepare('INSERT OR REPLACE INTO token_versions (user_id, version) VALUES (?, ?)').run(userId, version);
}

export function incrementTokenVersion(userId: string): number {
  const current = getTokenVersion(userId);
  const next = current + 1;
  setTokenVersion(userId, next);
  return next;
}
