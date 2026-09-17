import { StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing } from '@/theme';

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[type.title2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[type.callout, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing.xl },
});
