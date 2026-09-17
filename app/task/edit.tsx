import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Input, PeriodPicker } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { tasks, projects } from '@/db/repos';
import { useDataStore } from '@/stores/data';
import type { PeriodUnit, TaskPriority } from '@/db/types';
import { parseMinutesInput, formatMinutes } from '@/lib/format';
import { rescheduleAll } from '@/lib/notifications';

const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent'];
const MINUTE_CHIPS = [15, 30, 45, 60, 90, 120];

/** PRD §28 — adding a task takes < 10 seconds. */
export default function TaskEditScreen() {
  const { id, projectId } = useLocalSearchParams<{ id?: string; projectId?: string }>();
  const { colors, type } = useTheme();
  const router = useRouter();
  const { projects: projectList, refresh, reloadTasks } = useDataStore();

  const existing = id ? tasks.getTask(id) : null;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [projId, setProjId] = useState<string | null>(existing?.projectId ?? projectId ?? null);
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? 'none');
  const [triggerValue, setTriggerValue] = useState<number | null>(existing?.triggerValue ?? null);
  const [triggerUnit, setTriggerUnit] = useState<PeriodUnit | null>(existing?.triggerUnit ?? 'days');
  const [deadlineValue, setDeadlineValue] = useState<number | null>(existing?.deadlineValue ?? 1);
  const [deadlineUnit, setDeadlineUnit] = useState<PeriodUnit | null>(existing?.deadlineUnit ?? 'weeks');
  const [minutesText, setMinutesText] = useState(existing?.estimatedMinutes ? String(existing.estimatedMinutes) : '');

  const save = () => {
    if (!title.trim() || !projId) return;
    const minutes = minutesText ? parseMinutesInput(minutesText) : null;
    const payload = {
      title: title.trim(),
      projectId: projId,
      priority,
      triggerValue,
      triggerUnit: triggerValue != null ? triggerUnit : null,
      deadlineValue,
      deadlineUnit: deadlineValue != null ? deadlineUnit : null,
      estimatedMinutes: minutes,
    };
    if (existing) tasks.updateTask(existing.id, payload);
    else tasks.createTask({ ...payload, status: 'todo' });
    rescheduleAll();
    reloadTasks();
    refresh();
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={[type.title1, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xl }]}>
          {existing ? 'Edit Task' : 'New Task'}
        </Text>

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Implement WhatsApp template editor"
          autoFocus={!existing}
          onSubmitEditing={save}
          returnKeyType="done"
        />

        <Text style={[type.footnote, { color: colors.textTertiary, marginBottom: spacing.sm }]}>PROJECT</Text>
        <View style={styles.chipRow}>
          {projectList.map((p) => (
            <Chip key={p.id} label={p.title} active={p.id === projId} onPress={() => setProjId(p.id)} />
          ))}
        </View>

        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          PRIORITY
        </Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip key={p} label={p} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>

        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          START WORKING AFTER
        </Text>
        <PeriodPicker
          value={triggerValue}
          unit={triggerUnit}
          onChange={(v, u) => { setTriggerValue(v); setTriggerUnit(u); }}
          allowNone
        />

        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          DEADLINE
        </Text>
        <PeriodPicker
          value={deadlineValue}
          unit={deadlineUnit}
          onChange={(v, u) => { setDeadlineValue(v); setDeadlineUnit(u); }}
          allowNone
        />

        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          ESTIMATED WORK TIME
        </Text>
        <View style={styles.chipRow}>
          {MINUTE_CHIPS.map((m) => (
            <Chip
              key={m}
              label={formatMinutes(m)}
              active={minutesText === String(m)}
              onPress={() => setMinutesText(minutesText === String(m) ? '' : String(m))}
            />
          ))}
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <Input
            placeholder="Custom minutes (e.g. 90 or 1.5h)"
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="numeric"
          />
        </View>

        <Pressable
          onPress={save}
          disabled={!title.trim() || !projId}
          style={[styles.save, { backgroundColor: colors.accent, opacity: title.trim() && projId ? 1 : 0.4 }]}
        >
          <Text style={[type.calloutMedium, { color: '#fff' }]}>{existing ? 'Save changes' : 'Create task'}</Text>
        </Pressable>

        {projectList.length === 0 ? (
          <Text style={[type.footnote, { color: colors.status.blocked, marginTop: spacing.md }]}>
            Create a project first — tasks belong to projects.
          </Text>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : colors.bgSubtle,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[type.subheadMedium, { color: active ? colors.accent : colors.text, textTransform: 'capitalize' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  save: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.xl },
});
