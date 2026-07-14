import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, PrimaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  createTask,
  getActiveUsers,
  getSiteWorkers,
  getWorkerSite,
  getWorkerTasksToday,
  type ActiveUser,
  type Site,
  type WorkerTask,
} from '../../lib/api';

interface Member extends ActiveUser {
  tasks: WorkerTask[];
}

const STATUS_META: Record<WorkerTask['status'], { label: string; key: 'good' | 'warn' | 'neutral' | 'critical' }> = {
  PENDING: { label: 'Pending', key: 'neutral' },
  IN_PROGRESS: { label: 'In progress', key: 'warn' },
  COMPLETED: { label: 'Completed', key: 'good' },
  NOT_COMPLETED: { label: 'Not completed', key: 'critical' },
};

export default function Team() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [site, setSite] = useState<Site | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [picked, setPicked] = useState<Member | null>(null);
  const [taskText, setTaskText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  const supId = session?.userId ?? null;

  const load = useCallback(async () => {
    if (!session || supId == null) return;
    setLoaded(false);
    try {
      const mySite = await getWorkerSite(session.token, supId);
      setSite(mySite);
      if (!mySite) {
        setMembers([]);
        return;
      }
      const [roster, users] = await Promise.all([
        getSiteWorkers(session.token, mySite.id),
        getActiveUsers(session.token),
      ]);
      const workerIds = [...new Set(roster.map((r) => r.workerId))];
      const crew = users.filter((u) => workerIds.includes(u.id) && u.role === 'WORKER');
      const withTasks = await Promise.all(
        crew.map(async (u) => {
          try {
            const tasks = await getWorkerTasksToday(session.token, u.id);
            return { ...u, tasks };
          } catch {
            return { ...u, tasks: [] as WorkerTask[] };
          }
        }),
      );
      setMembers(withTasks);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not load your team', tone: 'error' });
    } finally {
      setLoaded(true);
    }
  }, [session, supId]);

  useEffect(() => {
    load();
  }, [load]);

  async function assign() {
    if (!session || supId == null || !site || !picked || !taskText.trim()) {
      setNotice({ text: 'Pick a worker and type a task', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await createTask(session.token, {
        siteId: site.id,
        workerId: picked.id,
        assignedBy: supId,
        description: taskText.trim(),
      });
      const ok = msg.toLowerCase().includes('success');
      setNotice({ text: ok ? `Task assigned to ${picked.fullName}` : msg, tone: ok ? 'good' : 'error' });
      if (ok) {
        setTaskText('');
        setPicked(null);
        await load();
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not assign task', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function chip(key: string): { color: string; bg: string } {
    switch (key) {
      case 'good': return { color: p.goodText, bg: 'rgba(12,163,12,0.13)' };
      case 'warn': return { color: p.warnText, bg: 'rgba(250,178,25,0.13)' };
      case 'critical': return { color: p.criticalText, bg: 'rgba(208,59,59,0.13)' };
      default: return { color: p.ink2, bg: p.track };
    }
  }

  const done = members.reduce((n, m) => n + m.tasks.filter((t) => t.status === 'COMPLETED').length, 0);
  const total = members.reduce((n, m) => n + m.tasks.length, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>My Team</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
        {site ? `${site.name} · ${members.length} worker${members.length === 1 ? '' : 's'}` : 'Resolving your site…'}
        {total > 0 ? `  ·  ${done}/${total} tasks done today` : ''}
      </Text>

      <Notice text={notice.text} tone={notice.tone} />

      {loaded && !site && (
        <Card style={{ alignItems: 'center', paddingVertical: 24, marginTop: 14 }}>
          <Ionicons name="alert-circle-outline" size={24} color={p.warnText} />
          <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8, textAlign: 'center' }}>
            You're not assigned to a site yet.{'\n'}Ask your admin to assign you.
          </Text>
        </Card>
      )}

      {site && (
        <>
          <SectionLabel>Assign a task</SectionLabel>
          <Card>
            <Text style={[styles.miniLabel, { color: p.ink3 }]}>WORKER</Text>
            <View style={styles.wrap}>
              {members.length === 0 && (
                <Text style={{ fontSize: 12, color: p.ink3 }}>No workers assigned to this site yet.</Text>
              )}
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setPicked(m)}
                  style={[
                    styles.pchip,
                    { borderColor: p.line, backgroundColor: picked?.id === m.id ? p.accent : p.card2 },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: picked?.id === m.id ? '#fff' : p.ink2 }}>
                    {m.fullName}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 12 }]}>TASK</Text>
            <TextInput
              value={taskText}
              onChangeText={setTaskText}
              multiline
              placeholder="e.g. Tie rebar for the Block C footing"
              placeholderTextColor={p.ink3}
              style={[styles.input, { backgroundColor: p.card2, borderColor: p.line, color: p.ink }]}
            />
            <PrimaryButton title="Assign Task" onPress={assign} loading={busy} style={{ marginTop: 12 }} />
          </Card>

          <SectionLabel>Progress today</SectionLabel>
          {members.map((m) => (
            <Card key={m.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: p.ink2 }}>
                    {m.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: p.ink, flex: 1 }}>{m.fullName}</Text>
                <Text style={{ fontSize: 11, color: p.ink3 }}>
                  {m.tasks.filter((t) => t.status === 'COMPLETED').length}/{m.tasks.length} done
                </Text>
              </View>
              {m.tasks.length === 0 ? (
                <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 8 }}>No tasks today.</Text>
              ) : (
                m.tasks.map((t) => {
                  const meta = STATUS_META[t.status];
                  const c = chip(meta.key);
                  return (
                    <View key={t.id} style={styles.taskRow}>
                      <Text style={{ fontSize: 12.5, color: p.ink2, flex: 1 }}>{t.description}</Text>
                      <View style={[styles.badge, { backgroundColor: c.bg }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: c.color }}>{meta.label}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  miniLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pchip: { borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 54,
    textAlignVertical: 'top',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  badge: { borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
});
