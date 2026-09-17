import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing, shadows, radius } from '@/theme';

/** Global quick-create "+" (PRD §29). */
export function Fab({ onPressTask, onPressProject }: { onPressTask: () => void; onPressProject: () => void }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPressProject}
        style={[styles.secondary, { backgroundColor: colors.elevated, borderColor: colors.borderStrong }, shadows.card]}
      >
        <Text style={[type.subheadMedium, { color: colors.text }]}>＋ Project</Text>
      </Pressable>
      <Pressable
        onPress={onPressTask}
        style={[styles.main, { backgroundColor: colors.accent }, shadows.fab]}
      >
        <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30 }}>＋</Text>
        <Text style={[type.subheadMedium, { color: '#fff' }]}>Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing['2xl'],
    bottom: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  secondary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
