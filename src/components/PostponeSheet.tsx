import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, addWeeks, nextMonday } from 'date-fns';
import { Sheet } from './Sheet';
import { useTheme, spacing, radius } from '@/theme';
import type { Task } from '@/db/types';

const OPTIONS: { label: string; calc: (from: Date) => Date }[] = [
  { label: 'Tomorrow', calc: (d) => addDays(d, 1) },
  { label: 'In 2 days', calc: (d) => addDays(d, 2) },
  { label: 'Next week', calc: (d) => nextMonday(addWeeks(d, 0)) },
];

/** PRD §13 — fast postpone; deadline deliberately untouched. */
export function PostponeSheet({
  task,
  visible,
  onClose,
  onPostpone,
}: {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onPostpone: (toDate: Date) => void;
}) {
  const { colors, type } = useTheme();
  return (
    <Sheet visible={visible} title="Postpone" onClose={onClose}>
      <Text style={[type.callout, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {task?.title}
      </Text>
      {task?.deadlineAt ? (
        <Text style={[type.footnote, { color: colors.status.overdue, marginBottom: spacing.lg }]}>
          Deadline stays {task.deadlineAt.slice(0, 10)} — postponing moves the working day only.
        </Text>
      ) : null}
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.label}
            onPress={() => onPostpone(o.calc(new Date()))}
            style={[styles.option, { borderColor: colors.border, backgroundColor: colors.bgSubtle }]}
          >
            <Text style={[type.calloutMedium, { color: colors.text }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
