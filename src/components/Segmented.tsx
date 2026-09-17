import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme, spacing, radius } from '@/theme';

export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const { colors, type } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[
              styles.chip,
              { backgroundColor: active ? colors.accentSoft : 'transparent', borderColor: active ? colors.accent : colors.border },
            ]}
          >
            <Text style={[type.subheadMedium, { color: active ? colors.accent : colors.textSecondary }]}>{o}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
