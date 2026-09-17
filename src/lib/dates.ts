import { format, isSameDay, differenceInCalendarDays, startOfDay } from 'date-fns';

export const todayStart = () => startOfDay(new Date());

export function isPastDay(iso: string | null, ref: Date = new Date()): boolean {
  if (!iso) return false;
  return differenceInCalendarDays(startOfDay(new Date(iso)), startOfDay(ref)) < 0;
}

export function isToday(iso: string | null, ref: Date = new Date()): boolean {
  if (!iso) return false;
  return isSameDay(new Date(iso), ref);
}

/** "2 weeks remaining" / "Due today" / "3 days overdue" */
export function describeRemaining(iso: string | null, ref: Date = new Date()): string | null {
  if (!iso) return null;
  const days = differenceInCalendarDays(startOfDay(new Date(iso)), startOfDay(ref));
  if (days < 0) return `${-days} day${-days === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days left`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} left`;
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatDay(iso: string): string {
  return format(new Date(iso), 'MMM d');
}

export function formatDayYear(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy');
}

export function formatFullDay(ref: Date = new Date()): string {
  return format(ref, 'EEEE, MMMM d');
}
