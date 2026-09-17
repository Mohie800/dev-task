import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen, Section } from '@/components';
import { useTheme, spacing, radius } from '@/theme';
import { useSettingsStore, type Appearance } from '@/stores/settings';
import { settings } from '@/db/repos';
import { SETTING_KEYS } from '@/db/repos/settings';
import { getDb, resetDatabase } from '@/db/client';
import { useDataStore } from '@/stores/data';
import { rescheduleAll, ensurePermissions } from '@/lib/notifications';

const APPEARANCES: Appearance[] = ['system', 'light', 'dark'];
const DAILY_TIMES = ['08:00', '09:00', '10:00'];
const EOD_TIMES = ['21:00', '22:00', '23:00'];
const WARN_OPTIONS = ['1', '2', '3'];

export default function SettingsScreen() {
  const { colors, type } = useTheme();
  const { appearance, setAppearance } = useSettingsStore();
  const { refresh } = useDataStore();

  const [notif, setNotif] = useState(settings.getSetting<string>(SETTING_KEYS.notifEnabled, 'true') === 'true');
  const [daily, setDaily] = useState(settings.getSetting<string>(SETTING_KEYS.dailyTime, '09:00'));
  const [eod, setEod] = useState(settings.getSetting<string>(SETTING_KEYS.eodTime, '22:00'));
  const [warn, setWarn] = useState(settings.getSetting<string>(SETTING_KEYS.warnDays, '1'));

  const toggleNotif = async (v: boolean) => {
    setNotif(v);
    settings.setSetting(SETTING_KEYS.notifEnabled, String(v));
    if (v) await ensurePermissions();
    rescheduleAll();
  };

  const exportData = async () => {
    const db = getDb();
    const dump = {
      app: 'DevTask',
      version: 1,
      exportedAt: new Date().toISOString(),
      owners: db.getAllSync('SELECT * FROM owners'),
      projects: db.getAllSync('SELECT * FROM projects'),
      tasks: db.getAllSync('SELECT * FROM tasks'),
      payments: db.getAllSync('SELECT * FROM payments'),
      task_postponements: db.getAllSync('SELECT * FROM task_postponements'),
      settings: db.getAllSync('SELECT * FROM settings'),
    };
    const uri = `${FileSystem.documentDirectory}devtask-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(dump, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  const importData = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    try {
      const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
      const dump = JSON.parse(raw);
      if (dump.app !== 'DevTask') throw new Error('Not a DevTask export');
      const db = getDb();
      db.withTransactionSync(() => {
        for (const t of ['payments', 'task_postponements', 'tasks', 'projects', 'owners', 'settings']) {
          db.execSync(`DELETE FROM ${t}`);
        }
        for (const row of dump.owners ?? []) db.runSync('INSERT OR REPLACE INTO owners (id,name,company,phone,email,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [row.id, row.name, row.company, row.phone, row.email, row.notes, row.created_at, row.updated_at]);
        for (const row of dump.projects ?? []) db.runSync('INSERT OR REPLACE INTO projects (id,title,owner_id,created_at,deadline_value,deadline_unit,deadline_at,pledged_amount,updated_at) VALUES (?,?,?,?,?,?,?,?,?)', [row.id, row.title, row.owner_id, row.created_at, row.deadline_value, row.deadline_unit, row.deadline_at, row.pledged_amount, row.updated_at]);
        for (const row of dump.tasks ?? []) db.runSync('INSERT OR REPLACE INTO tasks (id,project_id,title,status,priority,created_at,trigger_value,trigger_unit,trigger_at,deadline_value,deadline_unit,deadline_at,estimated_minutes,blocked_reason,blocked_reminder_at,postponed_to,completed_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [row.id, row.project_id, row.title, row.status, row.priority, row.created_at, row.trigger_value, row.trigger_unit, row.trigger_at, row.deadline_value, row.deadline_unit, row.deadline_at, row.estimated_minutes, row.blocked_reason, row.blocked_reminder_at, row.postponed_to, row.completed_at, row.updated_at]);
        for (const row of dump.payments ?? []) db.runSync('INSERT OR REPLACE INTO payments (id,project_id,amount,date,note,created_at) VALUES (?,?,?,?,?,?)', [row.id, row.project_id, row.amount, row.date, row.note, row.created_at]);
        for (const row of dump.task_postponements ?? []) db.runSync('INSERT OR REPLACE INTO task_postponements (id,task_id,from_date,to_date,created_at) VALUES (?,?,?,?,?)', [row.id, row.task_id, row.from_date, row.to_date, row.created_at]);
        for (const row of dump.settings ?? []) db.runSync('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', [row.key, row.value]);
      });
      refresh();
      rescheduleAll();
      Alert.alert('Import complete', 'Your data was restored.');
    } catch (e: any) {
      Alert.alert('Import failed', e?.message ?? 'Invalid file');
    }
  };

  const clearAll = () => {
    Alert.alert('Clear all data?', 'Everything will be deleted. This cannot be undone. Export first if unsure.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () => {
          resetDatabase();
          refresh();
          rescheduleAll();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={[type.display, { color: colors.text, marginTop: spacing.lg }]}>Settings</Text>

        <Section title="Notifications" />
        <View style={[styles.row, { borderColor: colors.border }]}>
          <Text style={[type.callout, { color: colors.text }]}>Enable notifications</Text>
          <Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: colors.accent }} />
        </View>
        <Chips label="Daily summary time" value={daily} options={DAILY_TIMES} onChange={(v) => { setDaily(v); settings.setSetting(SETTING_KEYS.dailyTime, v); rescheduleAll(); }} />
        <Chips label="End-of-day reminder" value={eod} options={EOD_TIMES} onChange={(v) => { setEod(v); settings.setSetting(SETTING_KEYS.eodTime, v); rescheduleAll(); }} />
        <Chips label="Deadline warning" value={warn} options={WARN_OPTIONS} suffix="day(s) before" onChange={(v) => { setWarn(v); settings.setSetting(SETTING_KEYS.warnDays, v); rescheduleAll(); }} />

        <Section title="Appearance" />
        <Chips
          label="Theme"
          value={appearance}
          options={APPEARANCES}
          onChange={(v) => {
            setAppearance(v as Appearance);
            settings.setSetting(SETTING_KEYS.appearance, v);
          }}
        />

        <Section title="Data" />
        <DataRow label="Export data (JSON)" onPress={exportData} colors={colors} type={type} />
        <DataRow label="Import data" onPress={importData} colors={colors} type={type} />
        <DataRow label="Clear all data" danger onPress={clearAll} colors={colors} type={type} />

        <Text style={[type.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing['3xl'] }]}>
          DevTask · offline-first · your data never leaves this device
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Chips({ label, value, options, onChange, suffix }: { label: string; value: string; options: string[]; onChange: (v: string) => void; suffix?: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[type.footnote, { color: colors.textTertiary, marginBottom: spacing.sm }]}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[styles.chip, { backgroundColor: active ? colors.accentSoft : colors.bgSubtle, borderColor: active ? colors.accent : colors.border }]}
            >
              <Text style={[type.subheadMedium, { color: active ? colors.accent : colors.text }]}>
                {o}{suffix && active ? ` ${suffix}` : ''}
              </Text>
            </Pressable>
          );
        })}
        {suffix && !options.includes(value) ? null : null}
      </View>
    </View>
  );
}

function DataRow({ label, onPress, colors, type, danger }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[type.callout, { color: danger ? colors.status.overdue : colors.text }]}>{label}</Text>
      <Text style={[type.footnote, { color: colors.textTertiary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
