/**
 * Task scheduling selectors — pure functions over Task[].
 * "Today" logic (PRD §11): a task surfaces on its trigger day unless postponed;
 * overdue = deadline passed; deadline-today tasks always surface.
 */
import type { Task } from '@/db/types';
import { startOfDay, addDays } from 'date-fns';

export function effectiveDay(t: Task): Date | null {
  const day = t.postponedTo ?? t.triggerAt;
  return day ? startOfDay(new Date(day)) : null;
}

export function isOverdue(t: Task, ref: Date = new Date()): boolean {
  if (t.status === 'done' || !t.deadlineAt) return false;
  return startOfDay(new Date(t.deadlineAt)) < startOfDay(ref);
}

export function isDueToday(t: Task, ref: Date = new Date()): boolean {
  if (t.status === 'done') return false;
  const day = effectiveDay(t);
  if (day && day <= startOfDay(ref)) return true;
  return t.deadlineAt ? startOfDay(new Date(t.deadlineAt)) <= startOfDay(ref) : false;
}

export function isUpcoming(t: Task, ref: Date = new Date()): boolean {
  if (t.status === 'done') return false;
  if (isDueToday(t, ref) || isOverdue(t, ref)) return false;
  const day = effectiveDay(t);
  return day !== null && day > startOfDay(ref);
}

/** Overdue first, then by deadline proximity, priority weight, then created. */
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export function sortForToday(a: Task, b: Task): number {
  const aOver = isOverdue(a) ? 0 : 1;
  const bOver = isOverdue(b) ? 0 : 1;
  if (aOver !== bOver) return aOver - bOver;
  const ad = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bd = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
  if (ad !== bd) return ad - bd;
  const pr = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
  if (pr !== 0) return pr;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export interface TodayBundle {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  completedToday: Task[];
  plannedMinutes: number;
}

export function splitToday(tasks: Task[], ref: Date = new Date()): TodayBundle {
  const today = startOfDay(ref);
  const overdue: Task[] = [];
  const todays: Task[] = [];
  const upcoming: Task[] = [];
  const completedToday: Task[] = [];
  let plannedMinutes = 0;

  for (const t of tasks) {
    if (t.completedAt && startOfDay(new Date(t.completedAt)) <= today) {
      if (startOfDay(new Date(t.completedAt)).getTime() === today.getTime()) completedToday.push(t);
    }
    if (t.status === 'done') continue;
    if (isOverdue(t, ref)) { overdue.push(t); continue; }
    if (isDueToday(t, ref)) { todays.push(t); plannedMinutes += t.estimatedMinutes ?? 0; continue; }
    if (isUpcoming(t, ref)) upcoming.push(t);
  }
  overdue.sort(sortForToday);
  todays.sort(sortForToday);
  upcoming.sort(sortForToday);
  return { overdue, today: todays, upcoming, completedToday, plannedMinutes };
}

/** Group tasks by project title (stable order by first appearance). */
export function groupByProject<T extends { projectTitle?: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.projectTitle ?? 'Unknown';
    const arr = map.get(key);
    if (arr) arr.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()];
}

/** Upcoming bucketed by calendar day for the "UP NEXT" section. */
export function upcomingByDay(tasks: Task[], from: Date = new Date()): [string, Task[]][] {
  const buckets = new Map<string, Task[]>();
  for (const t of tasks) {
    const day = effectiveDay(t) ?? addDays(startOfDay(from), 1);
    const key = day.toISOString().slice(0, 10);
    const arr = buckets.get(key);
    if (arr) arr.push(t);
    else buckets.set(key, [t]);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
}
