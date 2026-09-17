import type { Migration } from './0001_initial';
import { migrations as m0001 } from './0001_initial';

/** v2 — postpone support: working-day shift stored on task (PRD §13). */
const v2_postponedTo: Migration = {
  version: 2,
  name: 'postponed_to',
  up(db) {
    db.execSync('ALTER TABLE tasks ADD COLUMN postponed_to TEXT');
    db.execSync('CREATE INDEX idx_tasks_postponed_to ON tasks(postponed_to)');
  },
};

export const migrations: Migration[] = [...m0001, v2_postponedTo];
