/** Domain types — mirror SQLite schema (see migrations). Dates are ISO strings. */

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type PeriodUnit = 'days' | 'weeks' | 'months';

export interface Owner {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  ownerId: string | null;
  ownerName?: string | null;
  createdAt: string;
  deadlineValue: number | null;
  deadlineUnit: PeriodUnit | null;
  deadlineAt: string | null;
  pledgedAmount: number | null;
  updatedAt: string;
  /** computed */
  totalPaid?: number;
  taskCount?: number;
  doneCount?: number;
}

export interface Task {
  id: string;
  projectId: string;
  projectTitle?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  triggerValue: number | null;
  triggerUnit: PeriodUnit | null;
  triggerAt: string | null;
  deadlineValue: number | null;
  deadlineUnit: PeriodUnit | null;
  deadlineAt: string | null;
  estimatedMinutes: number | null;
  blockedReason: string | null;
  blockedReminderAt: string | null;
  postponedTo: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface TaskPostponement {
  id: string;
  taskId: string;
  fromDate: string;
  toDate: string;
  createdAt: string;
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];
export const TASK_PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
