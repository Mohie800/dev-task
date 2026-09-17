import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing, radius } from '@/theme';
import type { PeriodUnit } from '@/db/types';

const UNITS: PeriodUnit[] = ['days', 'weeks', 'months'];

/** value stepper + unit chips — the relative-period input (PRD §9). */
export function PeriodPicker({
  value,
  unit,
  onChange,
  allowNone = false,
}: {
  value: number | null;
  unit: PeriodUnit | null;
  onChange: (v: number | null, u: PeriodUnit | null) => void;
  allowNone?: boolean;
}) {
  const { colors, type } = useTheme();
  const none = allowNone && value === null;

  return (
    <View style={styles.row}>
      {allowNone ? (
        <Chip
        label="None"
        active={none}
        onPress={() => (none ? onChange(1, 'days') : onChange(null, null))}
        colors={colors}
      />
      ) : null}
      {!none ? (
        <>
          <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.bgSubtle }]}>
            <StepBtn label="−" onPress={() => onChange(Math.max(1, (value ?? 1) - 1), unit ?? 'days')} colors={colors} />
            <Text style={[type.title2, { color: colors.text, minWidth: 28, textAlign: 'center' }]}>{value ?? 1}</Text>
            <StepBtn label="+" onPress={() => onChange((value ?? 0) + 1, unit ?? 'days')} colors={colors} />
          </View>
          <View style={styles.chips}>
            {UNITS.map((u) => (
              <Chip
                key={u}
                label={u}
                active={unit === u}
                onPress={() => onChange(value ?? 1, u)}
                colors={colors}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Chip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.accentSoft : colors.bgSubtle, borderColor: active ? colors.accent : colors.border },
      ]}
    >
      <Text style={{ fontSize: 13, color: active ? colors.accent : colors.textSecondary }}>{label}</Text>
    </Pressable>
  );
}

function StepBtn({ label, onPress, colors }: { label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontSize: 18, color: colors.accent }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
