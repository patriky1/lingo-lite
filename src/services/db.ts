import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb() {
  db = await SQLite.openDatabaseAsync("lingo.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS progress (
      lesson_id TEXT PRIMARY KEY,
      ratio REAL NOT NULL
    );
  `);
}

export async function saveProgress(lessonId: string, ratio: number) {
  if (!db) return;
  await db.runAsync("INSERT OR REPLACE INTO progress (lesson_id, ratio) VALUES (?, ?)", [lessonId, ratio]);
}

export async function readProgress(): Promise<Record<string, number>> {
  if (!db) return {};
  const rows = await db.getAllAsync<{ lesson_id: string; ratio: number }>("SELECT * FROM progress");
  return Object.fromEntries(rows.map((r) => [r.lesson_id, r.ratio]));
}
