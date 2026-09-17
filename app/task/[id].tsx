import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, StatusPill, Sheet, Input, PostponeSheet, EmptyState } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { tasks } from '@/db/repos';
import type { Task } from '@/db/types';
import { describeRemaining, formatDayYear } from '@/lib/dates';
import { formatMinutes } from '@/lib/format';
import { formatRule } from '@/lib/periods';
import { isOverdue } from '@/lib/taskQueries';
import { rescheduleAll } from '@/lib/notifications';

const REMINDER_OPTIONS = [
  { label: 'None', days: 0 },
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
];

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, type } = useTheme();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockReminderDays, setBlockReminderDays] = useState(1);

  const reload = useCallback(() => {
    if (id) setTask(tasks.getTask(id));
  }, [id]);

  const pathname = usePathname();
  useEffect(() => {
    reload();
  }, [pathname, reload]);

  if (!task) {
    return (
      <Screen>
        <EmptyState title="Task not found" />
      </Screen>
    );
  }

  const overdue = isOverdue(task);
  const history = tasks.listPostponements(task.id);

  const setStatus = (status: Task['status']) => {
    if (status === 'done') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    tasks.setTaskStatus(task.id, status);
    rescheduleAll();
    reload();
  };

  const saveBlock = () => {
    const when = new Date();
    when.setDate(when.getDate() + blockReminderDays);
    tasks.updateTask(task.id, {
      title: task.title,
      projectId: task.projectId,
      status: 'blocked',
      priority: task.priority,
      triggerValue: task.triggerValue,
      triggerUnit: task.triggerUnit,
      deadlineValue: task.deadlineValue,
      deadlineUnit: task.deadlineUnit,
      estimatedMinutes: task.estimatedMinutes,
      blockedReason: blockReason.trim() || null,
      blockedReminderAt: blockReminderDays > 0 ? when.toISOString() : null,
    });
    rescheduleAll();
    setBlockOpen(false);
    reload();
  };

  const remove = () => {
    Alert.alert('Delete task?', `"${task.title}" will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          tasks.deleteTask(task.id);
          rescheduleAll();
          router.back();
        },
      },
    ]);
  };

  const done = task.status === 'done';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <View style={styles.between}>
            <StatusPill status={overdue ? 'overdue' : task.status} />
            {task.priority !== 'none' ? (
              <Text style={[type.footnote, { color: colors.textTertiary, textTransform: 'capitalize' }]}>
                {task.priority} priority
              </Text>
            ) : null}
          </View>
          <Text style={[type.title1, { color: colors.text }]}>{task.title}</Text>
          <Text style={[type.subhead, { color: colors.textSecondary }]}>{task.projectTitle}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <Row label="Created" value={formatDayYear(task.createdAt)} colors={colors} type={type} />
          {task.triggerValue != null && task.triggerUnit ? (
            <Row
              label="Start"
              value={`${formatRule({ value: task.triggerValue, unit: task.triggerUnit })} → ${task.triggerAt ? formatDayYear(task.triggerAt) : '—'}`}
              colors={colors}
              type={type}
            />
          ) : (
            <Row label="Start" value="Today" colors={colors} type={type} />
          )}
          {task.deadlineAt ? (
            <Row
              label="Deadline"
              value={`${formatDayYear(task.deadlineAt)} · ${describeRemaining(task.deadlineAt) ?? ''}`}
              colors={colors}
              type={type}
              valueColor={overdue ? colors.status.overdue : colors.text}
            />
          ) : null}
          {task.estimatedMinutes ? (
            <Row label="Work time" value={formatMinutes(task.estimatedMinutes)} colors={colors} type={type} />
          ) : null}
          {task.status === 'blocked' && task.blockedReason ? (
            <Row label="Blocked reason" value={task.blockedReason} colors={colors} type={type} />
          ) : null}
          {task.blockedReminderAt ? (
            <Row label="Blocked reminder" value={formatDayYear(task.blockedReminderAt)} colors={colors} type={type} />
          ) : null}
          {task.completedAt ? (
            <Row label="Completed" value={formatDayYear(task.completedAt)} colors={colors} type={type} />
          ) : null}
          {task.postponedTo ? (
            <Row label="Working day" value={formatDayYear(task.postponedTo)} colors={colors} type={type} />
          ) : null}
        </View>

        {!done ? (
          <View style={styles.actions}>
            {task.status !== 'in_progress' ? (
              <ActionBtn label="Start" color={colors.status.in_progress} onPress={() => setStatus('in_progress')} />
            ) : null}
            <ActionBtn label="Done" color={colors.status.done} onPress={() => setStatus('done')} />
            <ActionBtn label="Later" color={colors.status.todo} onPress={() => setPostponeOpen(true)} />
            {task.status !== 'blocked' ? (
              <ActionBtn label="Block" color={colors.status.blocked} onPress={() => setBlockOpen(true)} />
            ) : (
              <ActionBtn label="Unblock" color={colors.status.blocked} onPress={() => setStatus('in_progress')} />
            )}
          </View>
        ) : null}

        <Pressable onPress={() => router.push(`/task/edit?id=${task.id}`)} style={{ marginTop: spacing.xl }}>
          <Text style={[type.subheadMedium, { color: colors.accent }]}>Edit task</Text>
        </Pressable>

        {history.length ? (
          <View>
            <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing['2xl'], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
              Postponement history
            </Text>
            {history.map((h) => (
              <Text key={h.id} style={[type.footnote, { color: colors.textSecondary, paddingVertical: 2 }]}>
                {formatDayYear(h.fromDate)} → {formatDayYear(h.toDate)}
              </Text>
            ))}
          </View>
        ) : null}

        <Pressable onPress={remove} style={{ marginTop: spacing['3xl'], alignSelf: 'center' }}>
          <Text style={[type.subheadMedium, { color: colors.status.overdue }]}>Delete task</Text>
        </Pressable>
      </ScrollView>

      <PostponeSheet
        task={task}
        visible={postponeOpen}
        onClose={() => setPostponeOpen(false)}
        onPostpone={(to) => {
          tasks.postponeTask(task.id, to);
          rescheduleAll();
          setPostponeOpen(false);
          reload();
        }}
      />

      <Sheet visible={blockOpen} title="Block task" onClose={() => setBlockOpen(false)}>
        <Input
          label="Reason (optional)"
          value={blockReason}
          onChangeText={setBlockReason}
          placeholder="Waiting for Meta verification"
          autoFocus
        />
        <Text style={[type.footnote, { color: colors.textTertiary, marginBottom: spacing.sm }]}>REMIND ME IN</Text>
        <View style={styles.reminderRow}>
          {REMINDER_OPTIONS.map((o) => (
            <Pressable
              key={o.label}
              onPress={() => setBlockReminderDays(o.days)}
              style={[
                styles.reminderChip,
                {
                  backgroundColor: blockReminderDays === o.days ? colors.accentSoft : colors.bgSubtle,
                  borderColor: blockReminderDays === o.days ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[type.subheadMedium, { color: blockReminderDays === o.days ? colors.accent : colors.text }]}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={saveBlock} style={[styles.blockSave, { backgroundColor: colors.status.blocked }]}>
          <Text style={[type.calloutMedium, { color: '#fff' }]}>Mark as blocked</Text>
        </Pressable>
      </Sheet>
    </Screen>
  );
}

function Row({ label, value, colors, type, valueColor }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 4 }}>
      <Text style={[type.footnote, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[type.callout, { color: valueColor ?? colors.text, flex: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  const { type } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]}>
      <Text style={[type.calloutMedium, { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  action: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  reminderRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  reminderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  blockSave: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.xl },
});
