import { getDb } from '../client';
import { newId, nowIso } from '../id';
import type { PeriodUnit, Project } from '../types';
import { calculateProjectDeadline } from '@/lib/periods';

interface ProjectRow {
  id: string; title: string; owner_id: string | null; owner_name?: string | null;
  created_at: string; deadline_value: number | null; deadline_unit: string | null;
  deadline_at: string | null; pledged_amount: number | null; updated_at: string;
  total_paid?: number; task_count?: number; done_count?: number;
}

const map = (r: ProjectRow): Project => ({
  id: r.id, title: r.title, ownerId: r.owner_id, ownerName: r.owner_name ?? null,
  createdAt: r.created_at,
  deadlineValue: r.deadline_value, deadlineUnit: r.deadline_unit as PeriodUnit | null,
  deadlineAt: r.deadline_at, pledgedAmount: r.pledged_amount, updatedAt: r.updated_at,
  totalPaid: r.total_paid ?? 0, taskCount: r.task_count ?? 0, doneCount: r.done_count ?? 0,
});

const SELECT = `
  SELECT p.*, o.name AS owner_name,
    COALESCE((SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0) AS total_paid,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') AS done_count
  FROM projects p LEFT JOIN owners o ON o.id = p.owner_id
`;

export function listProjects(): Project[] {
  return getDb().getAllSync<ProjectRow>(`${SELECT} ORDER BY p.created_at DESC`).map(map);
}

export function getProject(id: string): Project | null {
  const r = getDb().getFirstSync<ProjectRow>(`${SELECT} WHERE p.id = ?`, [id]);
  return r ? map(r) : null;
}

export interface ProjectInput {
  title: string;
  ownerId: string | null;
  deadlineValue: number | null;
  deadlineUnit: PeriodUnit | null;
  pledgedAmount: number | null;
  createdAt?: Date;
}

export function createProject(input: ProjectInput): Project {
  const id = newId();
  const now = nowIso();
  const created = input.createdAt ?? new Date();
  const deadlineAt =
    input.deadlineValue != null && input.deadlineUnit
      ? calculateProjectDeadline(created, { value: input.deadlineValue, unit: input.deadlineUnit }).toISOString()
      : null;
  getDb().runSync(
    `INSERT INTO projects (id, title, owner_id, created_at, deadline_value, deadline_unit, deadline_at, pledged_amount, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, input.title, input.ownerId, created.toISOString(), input.deadlineValue, input.deadlineUnit, deadlineAt, input.pledgedAmount, now],
  );
  return getProject(id)!;
}

export function updateProject(id: string, patch: Partial<ProjectInput>): void {
  const cur = getProject(id);
  if (!cur) return;
  const merged = {
    title: patch.title ?? cur.title,
    ownerId: patch.ownerId !== undefined ? patch.ownerId : cur.ownerId,
    deadlineValue: patch.deadlineValue !== undefined ? patch.deadlineValue : cur.deadlineValue,
    deadlineUnit: patch.deadlineUnit !== undefined ? patch.deadlineUnit : cur.deadlineUnit,
    pledgedAmount: patch.pledgedAmount !== undefined ? patch.pledgedAmount : cur.pledgedAmount,
  };
  const base = new Date(cur.createdAt);
  const deadlineAt =
    merged.deadlineValue != null && merged.deadlineUnit
      ? calculateProjectDeadline(base, { value: merged.deadlineValue, unit: merged.deadlineUnit }).toISOString()
      : null;
  getDb().runSync(
    `UPDATE projects SET title=?, owner_id=?, deadline_value=?, deadline_unit=?, deadline_at=?, pledged_amount=?, updated_at=? WHERE id=?`,
    [merged.title, merged.ownerId, merged.deadlineValue, merged.deadlineUnit, deadlineAt, merged.pledgedAmount, nowIso(), id],
  );
}

export function deleteProject(id: string): void {
  getDb().runSync('DELETE FROM projects WHERE id = ?', [id]);
}

export function projectProgress(p: Pick<Project, 'taskCount' | 'doneCount'>): number {
  if (!p.taskCount) return 0;
  return Math.round((p.doneCount! / p.taskCount) * 100);
}
