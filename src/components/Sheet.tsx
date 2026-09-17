import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, spacing, shadows } from '@/theme';

export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors, type } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <View style={[styles.sheet, { backgroundColor: colors.elevated, shadowColor: colors.text }, shadows.sheet]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <Text style={[type.title1, { color: colors.text, marginBottom: spacing.lg }]}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginVertical: spacing.sm },
});
