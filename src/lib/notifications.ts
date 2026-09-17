/**
 * Local notification engine (PRD §14–17, §25).
 * All scheduling is on-device; scheduled notifications survive app-close and
 * device reboot. Content is recomputed and re-armed whenever data changes.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { addDays, isSameDay } from 'date-fns';
import { tasks, settings } from '@/db/repos';
import { SETTING_KEYS, getTimeSetting } from '@/db/repos/settings';
import { isDueToday, isOverdue } from './taskQueries';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady = false;
async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2F7CF6',
  });
  channelReady = true;
}

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function atTime(day: Date, t: { hour: number; minute: number }): Date {
  const d = new Date(day);
  d.setHours(t.hour, t.minute, 0, 0);
  return d;
}

async function schedule(title: string, body: string, when: Date) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      channelId: 'reminders',
      date: when,
    } as Notifications.NotificationTriggerInput,
  });
}

async function scheduleDaily(title: string, body: string, t: { hour: number; minute: number }) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: 'reminders',
      hour: t.hour,
      minute: t.minute,
    } as Notifications.NotificationTriggerInput,
  });
}

/** Recompute + re-arm everything. Safe to call often; cheap on this data scale. */
export async function rescheduleAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (settings.getSetting<string>(SETTING_KEYS.notifEnabled, 'true') !== 'true') return;
    if (!(await ensurePermissions())) return;
    await ensureChannel();

    const all = tasks.listTasks();
    const daily = getTimeSetting(SETTING_KEYS.dailyTime, '09:00');
    const eod = getTimeSetting(SETTING_KEYS.eodTime, '22:00');
    const warnDays = parseInt(settings.getSetting<string>(SETTING_KEYS.warnDays, '1'), 10) || 1;

    const dueToday = all.filter((t) => isDueToday(t) || isOverdue(t));
    const plannedMin = dueToday.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);

    await scheduleDaily(
      '☀️ Good morning',
      `You have ${dueToday.length} task${dueToday.length === 1 ? '' : 's'} scheduled for today` +
        (plannedMin ? ` · ${Math.floor(plannedMin / 60)}h ${plannedMin % 60}m planned.` : '.'),
      daily,
    );
    await scheduleDaily(
      '🌙 Unfinished tasks',
      dueToday.length
        ? `You have ${dueToday.length} unfinished task${dueToday.length === 1 ? '' : 's'} today.`
        : 'All of today\u2019s tasks are done. Nice work.',
      eod,
    );

    const now = new Date();
    for (const t of all) {
      if (t.status === 'done') continue;

      // Task start (PRD §15)
      const startDay = t.postponedTo ?? t.triggerAt;
      if (startDay) {
        const when = atTime(new Date(startDay), daily);
        if (when > now) {
          await schedule('🔵 Task reminder', `It's time to work on "${t.title}".`, when);
        }
      }

      // Deadline warning (PRD §16)
      if (t.deadlineAt) {
        const when = atTime(addDays(new Date(t.deadlineAt), -warnDays), daily);
        if (when > now && !isSameDay(when, new Date(t.deadlineAt))) {
          await schedule(
            '⚠️ Deadline approaching',
            `"${t.title}" is due in ${warnDays} day${warnDays === 1 ? '' : 's'}.`,
            when,
          );
        }
      }

      // Blocked reminder (PRD §18)
      if (t.status === 'blocked' && t.blockedReminderAt) {
        const when = atTime(new Date(t.blockedReminderAt), daily);
        if (when > now) {
          await schedule('🔴 Blocked task reminder', `"${t.title}" is still blocked. Check whether the blocker is resolved.`, when);
        }
      }
    }
  } catch (e) {
    console.warn('[notifications] reschedule failed', e);
  }
}
