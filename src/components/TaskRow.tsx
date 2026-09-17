import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing } from '@/theme';
import type { Task } from '@/db/types';
import { isOverdue } from '@/lib/taskQueries';
import { describeRemaining } from '@/lib/dates';
import { formatMinutes } from '@/lib/format';

const PRIORITY_MARK: Record<string, string> = { urgent: '‼', high: '!' };

export function TaskRow({ task, onPress }: { task: Task; onPress?: () => void }) {
  const { colors, type } = useTheme();
  const overdue = isOverdue(task);
  const due = overdue ? describeRemaining(task.deadlineAt) : null;
  const done = task.status === 'done';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.status[overdue ? 'overdue' : task.status] }]} />
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[
            type.calloutMedium,
            { color: done ? colors.textTertiary : colors.text, textDecorationLine: done ? 'line-through' : 'none' },
          ]}
        >
          {PRIORITY_MARK[task.priority] ? `${PRIORITY_MARK[task.priority]} ` : ''}
          {task.title}
        </Text>
        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: 2 }]}>
          {[
            task.projectTitle,
            task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : null,
            due,
            !overdue && !done ? describeRemaining(task.deadlineAt) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
