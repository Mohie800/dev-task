import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { Screen, Section, ProgressBar, StatusPill, TaskRow, Sheet, Input, EmptyState } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { projects, payments, tasks as tasksRepo } from '@/db/repos';
import type { Project, Task } from '@/db/types';
import { projectProgress } from '@/db/repos/projects';
import { describeRemaining, formatDay } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { rescheduleAll } from '@/lib/notifications';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, type } = useTheme();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const pathname = usePathname();
  useEffect(() => {
    if (!id) return;
    setProject(projects.getProject(id));
    setTaskList(tasksRepo.listTasksByProject(id));
  }, [pathname, id]);

  if (!project) {
    return (
      <Screen>
        <EmptyState title="Project not found" />
      </Screen>
    );
  }

  const progress = projectProgress(project);
  const totalPaid = project.totalPaid ?? 0;
  const pledged = project.pledgedAmount ?? 0;
  const remaining = pledged - totalPaid;
  const payPct = pledged > 0 ? Math.round((totalPaid / pledged) * 100) : 0;
  const deadline = describeRemaining(project.deadlineAt);
  const active = taskList.filter((t) => t.status !== 'done');
  const doneList = taskList.filter((t) => t.status === 'done');
  const blockedList = taskList.filter((t) => t.status === 'blocked');

  const savePayment = () => {
    const value = parseFloat(amount);
    if (!id || isNaN(value) || value <= 0) return;
    payments.addPayment({ projectId: id, amount: value, date: new Date().toISOString().slice(0, 10), note: note.trim() || null });
    setPayOpen(false);
    setAmount('');
    setNote('');
    setProject(projects.getProject(id));
  };

  const removeProject = () => {
    Alert.alert('Delete project?', `"${project.title}" and all its tasks will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          projects.deleteProject(project.id);
          rescheduleAll();
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[type.title1, { color: colors.text }]}>{project.title}</Text>
            {project.ownerName ? (
              <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 2 }]}>
                {project.ownerName}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => router.push(`/project/edit?id=${project.id}`)} hitSlop={8}>
            <Text style={[type.subheadMedium, { color: colors.accent }]}>Edit</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <View style={styles.between}>
            <Text style={[type.subheadMedium, { color: colors.textSecondary }]}>Progress</Text>
            <Text style={[type.headline, { color: colors.text }]}>{progress}%</Text>
          </View>
          <ProgressBar value={progress} />
          {deadline ? (
            <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.sm }]}>
              Deadline · {deadline}
            </Text>
          ) : null}
          <Text style={[type.footnote, { color: colors.textTertiary, marginTop: 2 }]}>
            {project.taskCount} total · {project.doneCount} done · {active.length} active
            {blockedList.length ? ` · ${blockedList.length} blocked` : ''}
          </Text>
        </View>

        {pledged > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <View style={styles.between}>
              <Text style={[type.subheadMedium, { color: colors.textSecondary }]}>Payment</Text>
              <Text style={[type.headline, { color: colors.text }]}>
                {formatMoney(totalPaid)} / {formatMoney(pledged)}
              </Text>
            </View>
            <ProgressBar value={payPct} color={colors.status.done} />
            <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.sm }]}>
              {formatMoney(remaining)} remaining
            </Text>
            <Section title="History" />
            {payments.listPayments(project.id).map((p) => (
              <View key={p.id} style={styles.payRow}>
                <Text style={[type.callout, { color: colors.textSecondary }]}>{formatDay(p.date)}</Text>
                <Text style={[type.calloutMedium, { color: colors.text, flex: 1, marginLeft: spacing.md }]}>
                  {p.note ?? 'Payment'}
                </Text>
                <Text style={[type.calloutMedium, { color: colors.status.done }]}>{formatMoney(p.amount)}</Text>
                <Pressable
                  onPress={() => {
                    payments.deletePayment(p.id);
                    setProject(projects.getProject(project.id));
                  }}
                  hitSlop={8}
                >
                  <Text style={[type.footnote, { color: colors.textTertiary }]}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setPayOpen(true)} style={{ marginTop: spacing.sm }}>
              <Text style={[type.subheadMedium, { color: colors.accent }]}>＋ Register payment</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push(`/project/edit?id=${project.id}`)} style={{ marginTop: spacing.md, marginLeft: spacing.xs }}>
            <Text style={[type.subheadMedium, { color: colors.accent }]}>＋ Set pledged amount / payments</Text>
          </Pressable>
        )}

        <View style={styles.between} >
          <Section title="Tasks" right={`${active.length} active`} />
          <Pressable
            onPress={() => router.push(`/task/edit?projectId=${project.id}`)}
            hitSlop={8}
            style={{ marginTop: spacing.lg }}
          >
            <Text style={[type.subheadMedium, { color: colors.accent }]}>＋ Add</Text>
          </Pressable>
        </View>
        {active.length === 0 && doneList.length === 0 ? (
          <EmptyState title="No tasks yet" body="Add the first task to this project." />
        ) : (
          active.map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TaskRow task={t} onPress={() => router.push(`/task/${t.id}`)} />
              </View>
            </View>
          ))
        )}
        {doneList.length ? (
          <View>
            <Section title="Completed" right={`${doneList.length}`} />
            {doneList.map((t) => (
              <TaskRow key={t.id} task={t} onPress={() => router.push(`/task/${t.id}`)} />
            ))}
          </View>
        ) : null}

        <Pressable onPress={removeProject} style={{ marginTop: spacing['3xl'], alignSelf: 'center' }}>
          <Text style={[type.subheadMedium, { color: colors.status.overdue }]}>Delete project</Text>
        </Pressable>
      </ScrollView>

      <Sheet visible={payOpen} title="Register payment" onClose={() => setPayOpen(false)}>
        <Input label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="1000" autoFocus />
        <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="First milestone" />
        <Pressable
          onPress={savePayment}
          style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: amount ? 1 : 0.4 }]}
          disabled={!amount}
        >
          <Text style={[type.calloutMedium, { color: '#fff' }]}>Save payment</Text>
        </Pressable>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.lg, marginBottom: spacing.md },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  saveBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
});
