import { getDb } from '../client';

export function getSetting<T = string>(key: string, fallback: T): T {
  const r = getDb().getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return (r?.value as T) ?? fallback;
}

export function setSetting(key: string, value: string): void {
  getDb().runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export const SETTING_KEYS = {
  notifEnabled: 'notifications.enabled',
  dailyTime: 'notifications.daily_time',
  eodTime: 'notifications.eod_time',
  warnDays: 'notifications.warn_days',
  appearance: 'appearance',
  defaultPriority: 'defaults.priority',
} as const;

export type NotificationTimes = { daily: { hour: number; minute: number }; eod: { hour: number; minute: number } };

export function getTimeSetting(key: string, fallback: string): { hour: number; minute: number } {
  const raw = getSetting<string>(key, fallback);
  const [h, m] = raw.split(':').map((s) => parseInt(s, 10));
  return { hour: isNaN(h) ? 9 : h, minute: isNaN(m) ? 0 : m };
}
