import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Section, ProgressBar, SwipeTaskRow, PostponeSheet, EmptyState, Fab } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { useDataStore } from '@/stores/data';
import { tasks as tasksRepo } from '@/db/repos';
import type { Task } from '@/db/types';
import { splitToday, groupByProject, upcomingByDay } from '@/lib/taskQueries';
import { greeting, formatFullDay } from '@/lib/dates';
import { formatMinutes } from '@/lib/format';
import { rescheduleAll } from '@/lib/notifications';
import { startOfDay, addDays } from 'date-fns';

export default function TodayScreen() {
  const { colors, type } = useTheme();
  const router = useRouter();
  const { tasks, loaded, refresh, reloadTasks } = useDataStore();
  const [postponeTarget, setPostponeTarget] = useState<Task | null>(null);

  const pathname = usePathname();
  useEffect(() => {
    if (!loaded) refresh();
    else reloadTasks();
  }, [pathname, loaded]);

  const bundle = useMemo(() => splitToday(tasks), [tasks]);
  const activeCount = bundle.overdue.length + bundle.today.length + bundle.completedToday.length;
  const doneCount = bundle.completedToday.length + bundle.today.filter((t) => t.status === 'done').length;
  const totalToday = bundle.overdue.length + bundle.today.length + bundle.completedToday.length;
  const progress = totalToday ? Math.round((doneCount / totalToday) * 100) : 0;
  const nextDays = useMemo(() => upcomingByDay(bundle.upcoming).slice(0, 3), [bundle.upcoming]);

  const mutate = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
    reloadTasks();
    rescheduleAll();
  };

  const openTask = (t: Task) => router.push(`/task/${t.id}`);

  const renderRows = (list: Task[], section: 'overdue' | 'today') => (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
      {list.map((t) => (
        <SwipeTaskRow
          key={t.id}
          task={t}
          onPress={() => openTask(t)}
          onStart={() => mutate(() => tasksRepo.setTaskStatus(t.id, 'in_progress'))}
          onDone={() => mutate(() => tasksRepo.setTaskStatus(t.id, 'done'))}
          onPostpone={() => setPostponeTarget(t)}
        />
      ))}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View>
            <Text style={[type.footnote, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
              {formatFullDay()}
            </Text>
            <Text style={[type.display, { color: colors.text, marginTop: spacing.xs }]}>
              {greeting()}
            </Text>

            {totalToday > 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <View style={styles.summaryRow}>
                  <Text style={[type.subheadMedium, { color: colors.textSecondary }]}>
                    TODAY · {totalToday} task{totalToday === 1 ? '' : 's'}
                    {bundle.plannedMinutes ? ` · ${formatMinutes(bundle.plannedMinutes)} planned` : ''}
                  </Text>
                  <Text style={[type.subheadMedium, { color: colors.textSecondary }]}>
                    {doneCount} / {totalToday}
                  </Text>
                </View>
                <ProgressBar value={progress} />
              </View>
            ) : null}

            {bundle.overdue.length ? (
              <View>
                <Section title="Overdue" right={`${bundle.overdue.length}`} />
                <View style={[styles.overdueWrap, { borderColor: colors.status.overdue }]}>
                  {renderRows(bundle.overdue, 'overdue')}
                </View>
              </View>
            ) : null}

            {bundle.today.length ? (
              <View>
                <Section title="Today" right={`${bundle.today.length}`} />
                {groupByProject(bundle.today).map(([project, list]) => (
                  <View key={project}>
                    <Text style={[type.footnote, { color: colors.accent, marginBottom: 2, marginTop: spacing.sm }]}>
                      {project}
                    </Text>
                    {renderRows(list, 'today')}
                  </View>
                ))}
              </View>
            ) : null}

            {bundle.completedToday.length ? (
              <View>
                <Section title="Completed" right={`${bundle.completedToday.length}`} />
                {bundle.completedToday.map((t) => (
                  <SwipeTaskRow key={t.id} task={t} onPress={() => openTask(t)} />
                ))}
              </View>
            ) : null}

            {nextDays.length ? (
              <View>
                <Section title="Up next" />                {nextDays.map(([day, list]) => (
                  <Pressable
                    key={day}
                    onPress={() => router.push('/tasks')}
                    style={[styles.upNext, { borderColor: colors.border }]}
                  >
                    <Text style={[type.calloutMedium, { color: colors.text }]}>
                      {describeDay(day)}
                    </Text>
                    <Text style={[type.footnote, { color: colors.textTertiary }]}>
                      {list.length} task{list.length === 1 ? '' : 's'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <WeekLoad tasks={[...bundle.today, ...bundle.upcoming]} />

            {activeCount === 0 && nextDays.length === 0 ? (
              <EmptyState
                title="You're all caught up 🎉"
                body="No tasks scheduled for today. Enjoy the free time or plan ahead."
              />
            ) : null}

            <View style={{ height: 120 }} />
          </View>
        }
      />

      <Fab
        onPressTask={() => router.push('/task/edit')}
        onPressProject={() => router.push('/project/edit')}
      />

      <PostponeSheet
        task={postponeTarget}
        visible={postponeTarget !== null}
        onClose={() => setPostponeTarget(null)}
        onPostpone={(to) => {
          if (postponeTarget) mutate(() => tasksRepo.postponeTask(postponeTarget.id, to));
          setPostponeTarget(null);
        }}
      />
    </Screen>
  );
}

function describeDay(isoDay: string): string {
  const d = new Date(isoDay + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/** PRD §21 — lightweight week workload bars. */
function WeekLoad({ tasks }: { tasks: Task[] }) {
  const { colors, type } = useTheme();
  const days: { label: string; minutes: number }[] = [];
  const monday = startOfDay(addDays(new Date(), -((new Date().getDay() + 6) % 7)));
  for (let i = 0; i < 5; i++) {
    const day = addDays(monday, i);
    const label = day.toLocaleDateString('en-US', { weekday: 'short' });
    const minutes = tasks
      .filter((t) => {
        const d = t.postponedTo ?? t.triggerAt;
        return d ? startOfDay(new Date(d)).getTime() === day.getTime() : false;
      })
      .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
    days.push({ label, minutes });
  }
  const total = days.reduce((s, d) => s + d.minutes, 0);
  const max = Math.max(...days.map((d) => d.minutes), 1);
  if (!total) return null;
  return (
    <View>
      <Section title="This week" right={formatMinutes(total) + ' planned'} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 64, paddingTop: 8 }}>
        {days.map((d) => (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}>
              <View
                style={{
                  height: Math.max((d.minutes / max) * 44, d.minutes ? 4 : 2),
                  borderRadius: 3,
                  backgroundColor: d.minutes ? colors.accent : colors.border,
                }}
              />
            </View>
            <Text style={[type.caption, { color: colors.textTertiary }]}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  overdueWrap: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  upNext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
