import { getDb } from '../client';
import { newId, nowIso } from '../id';
import type { PeriodUnit, Task, TaskPostponement, TaskPriority, TaskStatus } from '../types';
import { calculateTaskDates } from '@/lib/periods';

interface TaskRow {
  id: string; project_id: string; project_title?: string; title: string;
  status: TaskStatus; priority: TaskPriority; created_at: string;
  trigger_value: number | null; trigger_unit: string | null; trigger_at: string | null;
  deadline_value: number | null; deadline_unit: string | null; deadline_at: string | null;
  estimated_minutes: number | null; blocked_reason: string | null;
  blocked_reminder_at: string | null; postponed_to: string | null;
  completed_at: string | null; updated_at: string;
}

const map = (r: TaskRow): Task => ({
  id: r.id, projectId: r.project_id, projectTitle: r.project_title, title: r.title,
  status: r.status, priority: r.priority, createdAt: r.created_at,
  triggerValue: r.trigger_value, triggerUnit: r.trigger_unit as PeriodUnit | null, triggerAt: r.trigger_at,
  deadlineValue: r.deadline_value, deadlineUnit: r.deadline_unit as PeriodUnit | null, deadlineAt: r.deadline_at,
  estimatedMinutes: r.estimated_minutes, blockedReason: r.blocked_reason,
  blockedReminderAt: r.blocked_reminder_at, postponedTo: r.postponed_to,
  completedAt: r.completed_at, updatedAt: r.updated_at,
});

const SELECT = `
  SELECT t.*, p.title AS project_title
  FROM tasks t JOIN projects p ON p.id = t.project_id
`;

export function listTasks(): Task[] {
  return getDb().getAllSync<TaskRow>(`${SELECT} ORDER BY t.created_at DESC`).map(map);
}

export function listTasksByProject(projectId: string): Task[] {
  return getDb().getAllSync<TaskRow>(`${SELECT} WHERE t.project_id = ? ORDER BY t.created_at DESC`, [projectId]).map(map);
}

export function getTask(id: string): Task | null {
  const r = getDb().getFirstSync<TaskRow>(`${SELECT} WHERE t.id = ?`, [id]);
  return r ? map(r) : null;
}

export interface TaskInput {
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  triggerValue: number | null;
  triggerUnit: PeriodUnit | null;
  deadlineValue: number | null;
  deadlineUnit: PeriodUnit | null;
  estimatedMinutes: number | null;
  blockedReason?: string | null;
  blockedReminderAt?: string | null;
  createdAt?: Date;
}

export function createTask(input: TaskInput): Task {
  const id = newId();
  const now = nowIso();
  const created = input.createdAt ?? new Date();
  const dates = calculateTaskDates(created, {
    trigger: input.triggerValue != null && input.triggerUnit ? { value: input.triggerValue, unit: input.triggerUnit } : null,
    deadline: input.deadlineValue != null && input.deadlineUnit ? { value: input.deadlineValue, unit: input.deadlineUnit } : null,
  });
  const completedAt = input.status === 'done' ? created.toISOString() : null;
  getDb().runSync(
    `INSERT INTO tasks (id, project_id, title, status, priority, created_at,
      trigger_value, trigger_unit, trigger_at, deadline_value, deadline_unit, deadline_at,
      estimated_minutes, blocked_reason, blocked_reminder_at, completed_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, input.projectId, input.title, input.status, input.priority, created.toISOString(),
     input.triggerValue, input.triggerUnit, dates.triggerAt?.toISOString() ?? null,
     input.deadlineValue, input.deadlineUnit, dates.deadlineAt?.toISOString() ?? null,
     input.estimatedMinutes, input.blockedReason ?? null, input.blockedReminderAt ?? null, completedAt, now],
  );
  return getTask(id)!;
}

export function updateTask(id: string, patch: Partial<TaskInput>): void {
  const cur = getTask(id);
  if (!cur) return;
  const merged: TaskInput = {
    title: patch.title ?? cur.title,
    projectId: patch.projectId ?? cur.projectId,
    status: patch.status ?? cur.status,
    priority: patch.priority ?? cur.priority,
    triggerValue: patch.triggerValue !== undefined ? patch.triggerValue : cur.triggerValue,
    triggerUnit: patch.triggerUnit !== undefined ? patch.triggerUnit : cur.triggerUnit,
    deadlineValue: patch.deadlineValue !== undefined ? patch.deadlineValue : cur.deadlineValue,
    deadlineUnit: patch.deadlineUnit !== undefined ? patch.deadlineUnit : cur.deadlineUnit,
    estimatedMinutes: patch.estimatedMinutes !== undefined ? patch.estimatedMinutes : cur.estimatedMinutes,
    blockedReason: patch.blockedReason !== undefined ? patch.blockedReason : cur.blockedReason,
    blockedReminderAt: patch.blockedReminderAt !== undefined ? patch.blockedReminderAt : cur.blockedReminderAt,
  };
  const base = new Date(cur.createdAt);
  const dates = calculateTaskDates(base, {
    trigger: merged.triggerValue != null && merged.triggerUnit ? { value: merged.triggerValue, unit: merged.triggerUnit } : null,
    deadline: merged.deadlineValue != null && merged.deadlineUnit ? { value: merged.deadlineValue, unit: merged.deadlineUnit } : null,
  });
  const completedAt =
    merged.status === 'done' ? (cur.completedAt ?? nowIso()) : null;
  getDb().runSync(
    `UPDATE tasks SET project_id=?, title=?, status=?, priority=?,
      trigger_value=?, trigger_unit=?, trigger_at=?, deadline_value=?, deadline_unit=?, deadline_at=?,
      estimated_minutes=?, blocked_reason=?, blocked_reminder_at=?, completed_at=?, updated_at=?
     WHERE id=?`,
    [merged.projectId, merged.title, merged.status, merged.priority,
     merged.triggerValue, merged.triggerUnit, dates.triggerAt?.toISOString() ?? null,
     merged.deadlineValue, merged.deadlineUnit, dates.deadlineAt?.toISOString() ?? null,
     merged.estimatedMinutes, merged.blockedReason ?? null, merged.blockedReminderAt ?? null,
     completedAt, nowIso(), id],
  );
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  const completedAt = status === 'done' ? nowIso() : null;
  getDb().runSync('UPDATE tasks SET status=?, completed_at=?, updated_at=? WHERE id=?', [status, completedAt, nowIso(), id]);
  if (status !== 'blocked') {
    getDb().runSync('UPDATE tasks SET blocked_reason=NULL, blocked_reminder_at=NULL WHERE id=?', [id]);
  }
}

/** Move the working day; deadline intentionally untouched (PRD §13). */
export function postponeTask(id: string, toDate: Date): void {
  const db = getDb();
  const now = nowIso();
  const today = new Date().toISOString().slice(0, 10);
  const to = toDate.toISOString().slice(0, 10);
  db.withTransactionSync(() => {
    db.runSync('UPDATE tasks SET postponed_to=?, updated_at=? WHERE id=?', [to, now, id]);
    db.runSync(
      'INSERT INTO task_postponements (id, task_id, from_date, to_date, created_at) VALUES (?,?,?,?,?)',
      [newId(), id, today, to, now],
    );
  });
}

export function listPostponements(taskId: string): TaskPostponement[] {
  const rows = getDb().getAllSync<{
    id: string; task_id: string; from_date: string; to_date: string; created_at: string;
  }>('SELECT * FROM task_postponements WHERE task_id = ? ORDER BY created_at DESC', [taskId]);
  return rows.map((r) => ({ id: r.id, taskId: r.task_id, fromDate: r.from_date, toDate: r.to_date, createdAt: r.created_at }));
}

export function deleteTask(id: string): void {
  getDb().runSync('DELETE FROM tasks WHERE id = ?', [id]);
}
