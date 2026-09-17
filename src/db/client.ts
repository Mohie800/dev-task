/**
 * SQLite bootstrap — single on-device database, fully offline.
 * Dates stored as ISO-8601 strings (sortable, timezone-safe for a personal app).
 */
import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

export const DB_NAME = 'devtask.db';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

export function migrate(): void {
  const database = getDb();
  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > current) {
      database.withTransactionSync(() => {
        migration.up(database);
        database.execSync(`PRAGMA user_version = ${migration.version}`);
      });
      current = migration.version;
    }
  }
}

/** Test/dev helper: wipe everything. */
export function resetDatabase(): void {
  const database = getDb();
  database.withTransactionSync(() => {
    for (const t of ['payments', 'task_postponements', 'tasks', 'projects', 'owners', 'settings']) {
      database.execSync(`DROP TABLE IF EXISTS ${t}`);
    }
    database.execSync('PRAGMA user_version = 0');
  });
  migrate();
}
