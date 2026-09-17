import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Section, ProgressBar, EmptyState } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { useDataStore } from '@/stores/data';
import { projectProgress } from '@/db/repos/projects';
import { describeRemaining } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

export default function ProjectsScreen() {
  const { colors, type } = useTheme();
  const router = useRouter();
  const { projects, loaded, refresh } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      if (!loaded) refresh();
    }, [loaded]),
  );

  return (
    <Screen>
      <Text style={[type.display, { color: colors.text, marginTop: spacing.lg }]}>Projects</Text>
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <EmptyState
            title="No projects yet"
            body="Create your first project to start organizing your work."
            action={
              <Pressable
                onPress={() => router.push('/project/edit')}
                style={[styles.cta, { backgroundColor: colors.accent }]}
              >
                <Text style={[type.calloutMedium, { color: '#fff' }]}>Create Project</Text>
              </Pressable>
            }
          />
        }
        renderItem={({ item: p }) => {
          const progress = projectProgress(p);
          const remaining = p.pledgedAmount != null ? p.pledgedAmount - (p.totalPaid ?? 0) : null;
          const deadline = describeRemaining(p.deadlineAt);
          const over = p.deadlineAt ? new Date(p.deadlineAt) < new Date() && progress < 100 : false;
          return (
            <Pressable
              onPress={() => router.push(`/project/${p.id}`)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={[type.headline, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={[type.subheadMedium, { color: colors.textSecondary }]}>{progress}%</Text>
              </View>
              <ProgressBar value={progress} color={over ? colors.status.overdue : colors.accent} />
              <View style={styles.metaRow}>
                <Text style={[type.footnote, { color: colors.textTertiary }]}>
                  {p.doneCount} / {p.taskCount} tasks
                </Text>
                {deadline ? (
                  <Text style={[type.footnote, { color: over ? colors.status.overdue : colors.textTertiary }]}>
                    {deadline}
                  </Text>
                ) : null}
                {remaining != null && remaining > 0 ? (
                  <Text style={[type.footnote, { color: colors.textTertiary }]}>
                    {formatMoney(remaining)} left
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
});
