import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Input, PeriodPicker, Sheet } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { projects, owners } from '@/db/repos';
import { useDataStore } from '@/stores/data';
import type { PeriodUnit } from '@/db/types';
import { rescheduleAll } from '@/lib/notifications';

export default function ProjectEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, type } = useTheme();
  const router = useRouter();
  const { owners: ownerList, refresh } = useDataStore();

  const existing = id ? projects.getProject(id) : null;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [ownerId, setOwnerId] = useState<string | null>(existing?.ownerId ?? null);
  const [deadlineValue, setDeadlineValue] = useState<number | null>(existing?.deadlineValue ?? null);
  const [deadlineUnit, setDeadlineUnit] = useState<PeriodUnit | null>(existing?.deadlineUnit ?? 'weeks');
  const [pledged, setPledged] = useState(existing?.pledgedAmount?.toString() ?? '');
  const [ownerSheet, setOwnerSheet] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerCompany, setNewOwnerCompany] = useState('');

  const save = () => {
    if (!title.trim()) return;
    const pledgedNum = pledged ? parseFloat(pledged) : null;
    const payload = {
      title: title.trim(),
      ownerId,
      deadlineValue,
      deadlineUnit: deadlineValue != null ? deadlineUnit : null,
      pledgedAmount: pledgedNum != null && !isNaN(pledgedNum) ? pledgedNum : null,
    };
    if (existing) projects.updateProject(existing.id, payload);
    else projects.createProject(payload);
    rescheduleAll();
    refresh();
    router.back();
  };

  const addOwner = () => {
    if (!newOwnerName.trim()) return;
    const o = owners.createOwner({ name: newOwnerName.trim(), company: newOwnerCompany.trim() || null, phone: null, email: null, notes: null });
    setOwnerId(o.id);
    refresh();
    setOwnerSheet(false);
    setNewOwnerName('');
    setNewOwnerCompany('');
  };

  const selectedOwner = ownerList.find((o) => o.id === ownerId);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={[type.title1, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xl }]}>
          {existing ? 'Edit Project' : 'New Project'}
        </Text>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Sadah CRM" autoFocus={!existing} />

        <Text style={[type.footnote, { color: colors.textTertiary, marginBottom: spacing.sm }]}>OWNER</Text>
        <View style={styles.ownerRow}>
          {selectedOwner ? (
            <Chip label={selectedOwner.name} active onPress={() => setOwnerSheet(true)} />
          ) : (
            <Chip label="Select owner…" onPress={() => setOwnerSheet(true)} />
          )}
        </View>

        <Text style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          DEADLINE (PERIOD)
        </Text>
        <PeriodPicker
          value={deadlineValue}
          unit={deadlineUnit}
          onChange={(v, u) => {
            setDeadlineValue(v);
            setDeadlineUnit(u);
          }}
          allowNone
        />

        <View style={{ marginTop: spacing.lg }}>
          <Input
            label="Pledged amount (USD, optional)"
            value={pledged}
            onChangeText={setPledged}
            keyboardType="decimal-pad"
            placeholder="5000"
          />
        </View>

        <Pressable
          onPress={save}
          disabled={!title.trim()}
          style={[styles.save, { backgroundColor: colors.accent, opacity: title.trim() ? 1 : 0.4 }]}
        >
          <Text style={[type.calloutMedium, { color: '#fff' }]}>
            {existing ? 'Save changes' : 'Create project'}
          </Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      <Sheet visible={ownerSheet} title="Owner" onClose={() => setOwnerSheet(false)}>
        <View style={styles.ownerGrid}>
          {ownerList.map((o) => (
            <Chip key={o.id} label={o.name} active={o.id === ownerId} onPress={() => { setOwnerId(o.id); setOwnerSheet(false); }} />
          ))}
        </View>
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Input placeholder="Owner name" value={newOwnerName} onChangeText={setNewOwnerName} />
          <Input placeholder="Company (optional)" value={newOwnerCompany} onChangeText={setNewOwnerCompany} />
          <Pressable onPress={addOwner} disabled={!newOwnerName.trim()} style={[styles.save, { backgroundColor: colors.accent, opacity: newOwnerName.trim() ? 1 : 0.4 }]}>
            <Text style={[type.calloutMedium, { color: '#fff' }]}>Add owner</Text>
          </Pressable>
        </View>
      </Sheet>
    </Screen>
  );
}

function Chip({ label, active, onPress, highlight }: { label: string; active?: boolean; onPress: () => void; highlight?: boolean }) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : highlight ? 'transparent' : colors.bgSubtle,
          borderColor: active ? colors.accent : highlight ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[type.calloutMedium, { color: active || highlight ? colors.accent : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ownerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ownerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  save: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.xl },
});
