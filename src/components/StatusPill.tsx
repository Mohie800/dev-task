import { StyleSheet, Text, View } from 'react-native';
import { useTheme, radius, spacing, type StatusKey } from '@/theme';
import { STATUS_LABELS } from '@/db/types';

export function StatusPill({ status }: { status: StatusKey }) {
  const { colors, type } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.statusSoft[status] }]}>
      <View style={[styles.dot, { backgroundColor: colors.status[status] }]} />
      <Text style={[type.caption, { color: colors.status[status] }]}>{STATUS_LABELS[status] ?? 'Overdue'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
