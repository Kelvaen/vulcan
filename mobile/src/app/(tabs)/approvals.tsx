import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Notice, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  approveUser,
  getActiveUsers,
  getPendingUsers,
  rejectUser,
  removeUser,
  type ActiveUser,
  type PendingUser,
} from '../../lib/api';

export default function People() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [team, setTeam] = useState<ActiveUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [pend, active] = await Promise.all([
        getPendingUsers(session.token, session.companyId),
        getActiveUsers(session.token, session.companyId),
      ]);
      setPending(pend);
      setTeam(active);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not load people', tone: 'error' });
    } finally {
      setLoaded(true);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function act(user: PendingUser, action: 'approve' | 'reject') {
    if (!session) return;
    setBusyId(user.id);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg =
        action === 'approve'
          ? await approveUser(session.token, user.id)
          : await rejectUser(session.token, user.id);
      const blocked = msg.toLowerCase().includes('limit');
      setNotice({
        text: `${user.fullName}: ${msg}`,
        tone: blocked ? 'error' : action === 'approve' ? 'good' : 'warn',
      });
      if (!blocked) await load();
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Action failed', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  async function fire(user: ActiveUser) {
    if (!session) return;
    setBusyId(user.id);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg = await removeUser(session.token, user.id);
      setNotice({ text: msg, tone: 'warn' });
      setConfirmId(null);
      await load();
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not remove', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>People</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
        {pending.length} pending · {team.length} active employee{team.length === 1 ? '' : 's'}
      </Text>

      <Notice text={notice.text} tone={notice.tone} />

      <SectionLabel>Pending approval</SectionLabel>
      {loaded && pending.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 18 }}>
          <Ionicons name="shield-checkmark-outline" size={22} color={p.good} />
          <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 6 }}>
            No one is waiting for approval
          </Text>
        </Card>
      )}
      {pending.map((u) => (
        <Card key={u.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: p.ink2 }}>{initials(u.fullName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: p.ink }}>{u.fullName}</Text>
              <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 1 }}>
                {u.email} · {u.role}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
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

      <SectionLabel>Team</SectionLabel>
      {loaded && team.length === 0 && (
        <Card>
          <Text style={{ fontSize: 12.5, color: p.ink3 }}>No active employees yet.</Text>
        </Card>
      )}
      {team.map((u) => {
        const self = u.id === session?.userId;
        const confirming = confirmId === u.id;
        return (
          <Card key={u.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: p.ink2 }}>{initials(u.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: p.ink }}>
                  {u.fullName}
                  {self ? '  (you)' : ''}
                </Text>
                <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 1 }}>
                  {u.email} · {u.role}
                </Text>
              </View>
              {!self &&
                (confirming ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable
                      disabled={busyId === u.id}
                      onPress={() => fire(u)}
                      style={[styles.smallBtn, { backgroundColor: 'rgba(208,59,59,0.13)' }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: p.criticalText }}>
                        Confirm remove
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setConfirmId(null)}
                      style={[styles.smallBtn, styles.btnGhost, { borderColor: p.line }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: p.ink2 }}>Keep</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setConfirmId(u.id)}
                    style={[styles.smallBtn, styles.btnGhost, { borderColor: 'rgba(208,59,59,0.4)' }]}
                  >
                    <Ionicons name="person-remove-outline" size={13} color={p.criticalText} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: p.criticalText }}>Remove</Text>
                  </Pressable>
                ))}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
});
