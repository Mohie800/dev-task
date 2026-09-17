import { StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing } from '@/theme';

export function Section({ title, right }: { title: string; right?: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[type.footnote, { color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' }]}>
        {title}
      </Text>
      {right ? <Text style={[type.footnote, { color: colors.textTertiary }]}>{right}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
});
