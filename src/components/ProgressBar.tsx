import { StyleSheet, View } from 'react-native';
import { useTheme, radius } from '@/theme';

export function ProgressBar({ value, color, height = 5 }: { value: number; color?: string; height?: number }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.track, { backgroundColor: colors.border, height, borderRadius: radius.full }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: color ?? colors.accent, borderRadius: radius.full },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
