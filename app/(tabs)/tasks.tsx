import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Segmented, Input, SwipeTaskRow, PostponeSheet, EmptyState } from '@/components';
import { useTheme, spacing } from '@/theme';
import { useDataStore } from '@/stores/data';
import { tasks as tasksRepo } from '@/db/repos';
import type { Task, TaskStatus } from '@/db/types';
import { isOverdue, isDueToday, isUpcoming } from '@/lib/taskQueries';
import { rescheduleAll } from '@/lib/notifications';

const FILTERS = ['All', 'Today', 'Upcoming', 'Overdue', 'In Progress', 'Blocked', 'Done'] as const;
type Filter = (typeof FILTERS)[number];

export default function TasksScreen() {
  const { colors, type } = useTheme();
  const router = useRouter();
  const { tasks, loaded, refresh, reloadTasks } = useDataStore();
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [postponeTarget, setPostponeTarget] = useState<Task | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!loaded) refresh();
      else reloadTasks();
    }, [loaded]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      switch (filter) {
        case 'Today':
          return isDueToday(t);
        case 'Upcoming':
          return isUpcoming(t);
        case 'Overdue':
          return isOverdue(t);
        case 'In Progress':
          return t.status === 'in_progress';
        case 'Blocked':
          return t.status === 'blocked';
        case 'Done':
          return t.status === 'done';
        default:
          return true;
      }
    }).filter((t) => (q ? t.title.toLowerCase().includes(q) : true));
  }, [tasks, filter, query]);

  return (
    <Screen>
      <Text style={[type.display, { color: colors.text, marginTop: spacing.lg }]}>Tasks</Text>
      <View style={{ marginVertical: spacing.md, gap: spacing.md }}>
        <Segmented options={[...FILTERS]} value={filter} onChange={(f) => setFilter(f as Filter)} />
        <Input placeholder="Search tasks" value={query} onChangeText={setQuery} autoCapitalize="none" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState title="Nothing here" body="No tasks match this filter." />}
        renderItem={({ item }) => (
          <SwipeTaskRow
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onStart={() => { tasksRepo.setTaskStatus(item.id, 'in_progress'); reloadTasks(); rescheduleAll(); }}
            onDone={() => { tasksRepo.setTaskStatus(item.id, 'done'); reloadTasks(); rescheduleAll(); }}
            onPostpone={() => setPostponeTarget(item)}
          />
        )}
      />
      <PostponeSheet
        task={postponeTarget}
        visible={postponeTarget !== null}
        onClose={() => setPostponeTarget(null)}
        onPostpone={(to) => {
          if (postponeTarget) tasksRepo.postponeTask(postponeTarget.id, to);
          setPostponeTarget(null);
          reloadTasks();
          rescheduleAll();
        }}
      />
    </Screen>
  );
}
