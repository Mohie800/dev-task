import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, spacing, radius } from '@/theme';

export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Text style={[type.footnote, { color: colors.textTertiary, marginBottom: 6 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: type.font.regular,
            fontSize: type.callout.fontSize,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
