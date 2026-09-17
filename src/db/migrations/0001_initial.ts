import type * as SQLite from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => void;
}

/**
 * v1 — core entities per PRD §26.
 * Relative scheduling rules (value/unit) preserved next to calculated dates.
 */
const v1_initial: Migration = {
  version: 1,
  name: 'initial',
  up(db) {
    db.execSync(`
      CREATE TABLE owners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        owner_id TEXT REFERENCES owners(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        deadline_value INTEGER,
        deadline_unit TEXT,
        deadline_at TEXT,
        pledged_amount REAL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo'
          CHECK (status IN ('todo','in_progress','blocked','done')),
        priority TEXT NOT NULL DEFAULT 'none'
          CHECK (priority IN ('none','low','medium','high','urgent')),
        created_at TEXT NOT NULL,
        trigger_value INTEGER,
        trigger_unit TEXT,
        trigger_at TEXT,
        deadline_value INTEGER,
        deadline_unit TEXT,
        deadline_at TEXT,
        estimated_minutes INTEGER,
        blocked_reason TEXT,
        blocked_reminder_at TEXT,
        completed_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE payments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE task_postponements (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX idx_tasks_project ON tasks(project_id);
      CREATE INDEX idx_tasks_status ON tasks(status);
      CREATE INDEX idx_tasks_trigger_at ON tasks(trigger_at);
      CREATE INDEX idx_tasks_deadline_at ON tasks(deadline_at);
      CREATE INDEX idx_payments_project ON payments(project_id);
      CREATE INDEX idx_postponements_task ON task_postponements(task_id);
    `);
  },
};

export const migrations: Migration[] = [v1_initial];
