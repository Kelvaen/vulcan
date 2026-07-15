import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Notice } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { approveUser, getPendingUsers, rejectUser, type PendingUser } from '../../lib/api';

export default function Approvals() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  const load = useCallback(() => {
    if (!session) return;
    getPendingUsers(session.token, session.companyId)
      .then(setPending)
      .catch((e) => setNotice({ text: e?.message ?? 'Could not load queue', tone: 'error' }))
      .finally(() => setLoaded(true));
  }, [session]);

  useEffect(load, [load]);

  async function act(user: PendingUser, action: 'approve' | 'reject') {
    if (!session) return;
    setBusyId(user.id);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg =
        action === 'approve'
          ? await approveUser(session.token, user.id)
          : await rejectUser(session.token, user.id);
      setNotice({ text: `${user.fullName}: ${msg}`, tone: action === 'approve' ? 'good' : 'warn' });
      setPending((list) => list.filter((u) => u.id !== user.id));
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Action failed', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Approvals</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
            {pending.length} pending registration{pending.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={load}
          style={[styles.refresh, { backgroundColor: p.card, borderColor: p.line }]}
          accessibilityLabel="Refresh queue"
        >
          <Ionicons name="refresh-outline" size={18} color={p.ink2} />
        </Pressable>
      </View>

      <Notice text={notice.text} tone={notice.tone} />

      {loaded && pending.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 26, marginTop: 16 }}>
          <Ionicons name="shield-checkmark-outline" size={26} color={p.good} />
          <Text style={{ fontSize: 13, color: p.ink3, marginTop: 8 }}>
            Queue is clear — no one is waiting
          </Text>
        </Card>
      )}

      {pending.map((u) => (
        <Card key={u.id} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: p.ink2 }}>
                {u.fullName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: p.ink }}>{u.fullName}</Text>
              <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 1 }}>
                {u.email} · {u.role}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Pressable
              disabled={busyId === u.id}
              onPress={() => act(u, 'approve')}
              style={[styles.btn, { backgroundColor: p.accent }]}
            >
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={styles.btnTxt}>Approve</Text>
            </Pressable>
            <Pressable
              disabled={busyId === u.id}
              onPress={() => act(u, 'reject')}
              style={[styles.btn, styles.btnGhost, { borderColor: p.line }]}
            >
              <Ionicons name="close" size={15} color={p.ink2} />
              <Text style={[styles.btnTxt, { color: p.ink2 }]}>Reject</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    paddingVertical: 11,
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
