import * as SQLite from 'expo-sqlite';
import { TimetableData } from './timetable-parser';

const DB_NAME = 'school_planner.db';

export interface SavedTimetable {
  id: number;
  url: string;
  title: string;
  data: string; // JSON stringified TimetableData
  last_updated: string;
}

export interface AppSettings {
  active_timetable_id: number | null;
  notifications_enabled: boolean;
  notify_all_lessons: boolean; // false = only first lesson, true = all lessons
}

export async function getDb() {
  return await SQLite.openDatabaseAsync(DB_NAME);
}

export async function initDb() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initialize default settings if not present
  const activeId = await getSetting('active_timetable_id');
  if (activeId === null) await setSetting('active_timetable_id', null);

  const notifyEnabled = await getSetting('notifications_enabled');
  if (notifyEnabled === null) await setSetting('notifications_enabled', 'false');

  const notifyAll = await getSetting('notify_all_lessons');
  if (notifyAll === null) await setSetting('notify_all_lessons', 'false');
}

export async function saveTimetable(url: string, title: string, data: TimetableData) {
  const db = await getDb();
  const existing = await db.getFirstAsync<SavedTimetable>(
    'SELECT * FROM timetables WHERE url = ?',
    [url]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE timetables SET title = ?, data = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [title, JSON.stringify(data), existing.id]
    );
    return existing.id;
  } else {
    const result = await db.runAsync(
      'INSERT INTO timetables (url, title, data) VALUES (?, ?, ?)',
      [url, title, JSON.stringify(data)]
    );
    return result.lastInsertRowId;
  }
}

export async function getTimetables(): Promise<SavedTimetable[]> {
  const db = await getDb();
  return await db.getAllAsync<SavedTimetable>('SELECT * FROM timetables ORDER BY last_updated DESC');
}

export async function getTimetableById(id: number): Promise<SavedTimetable | null> {
  const db = await getDb();
  return await db.getFirstAsync<SavedTimetable>('SELECT * FROM timetables WHERE id = ?', [id]);
}

export async function deleteTimetable(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM timetables WHERE id = ?', [id]);
}

export async function setSetting(key: string, value: any) {
  const db = await getDb();
  const stringValue = value === null ? null : String(value);
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, stringValue]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

export async function getAppSettings(): Promise<AppSettings> {
  const activeId = await getSetting('active_timetable_id');
  const notifyEnabled = await getSetting('notifications_enabled');
  const notifyAll = await getSetting('notify_all_lessons');

  return {
    active_timetable_id: activeId ? parseInt(activeId) : null,
    notifications_enabled: notifyEnabled === 'true',
    notify_all_lessons: notifyAll === 'true'
  };
}
