/**
 * Today — placeholder shell (M0). Real implementation lands in M3.
 * Renders on the design tokens so light/dark quality is verifiable from day one.
 */
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useTheme, spacing } from '@/theme';

export default function TodayScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { colors, type } = theme;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={[type.footnote, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
          {format(new Date(), 'EEEE, MMMM d')}
        </Text>
        <Text style={[type.display, { color: colors.text, marginTop: spacing.xs }]}>
          Good morning
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[type.callout, { color: colors.textSecondary }]}>
          Today screen ships in milestone M3 — projects, tasks and the data
          layer come first. Theme ({scheme ?? 'light'}) and tokens are live.
        </Text>

        <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
          <View style={[styles.dot, { backgroundColor: colors.status.in_progress }]} />
          <Text style={[type.subheadMedium, { color: colors.accent }]}>
            M0 foundation — no UI slop from day one
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing['2xl'], paddingTop: spacing['3xl'] },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing['2xl'] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginTop: spacing['2xl'],
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
