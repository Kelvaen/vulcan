import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui';
import { useAuth } from '../context/auth';
import { useTheme } from '../context/theme';
import {
  getPendingUsers,
  getSurveysByStatus,
  getWorkerTasksToday,
} from '../lib/api';

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tone: 'good' | 'warn' | 'neutral' | 'accent';
}

export default function Notifications() {
  const { p } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    const role = session.role;
    const uid = session.userId ?? 0;
    (async () => {
      const out: Item[] = [];
      try {
        if (role === 'WORKER' || role === 'SUPERVISOR') {
          const tasks = await getWorkerTasksToday(session.token, uid).catch(() => []);
          const open = tasks.filter((t) => t.status !== 'COMPLETED');
          if (open.length) {
            out.push({
              icon: 'clipboard-outline',
              title: `${open.length} task${open.length === 1 ? '' : 's'} to do today`,
              sub: open.map((t) => t.description).slice(0, 3).join(' · '),
              tone: 'accent',
            });
          }
        }
        if (role === 'SUPERVISOR') {
          const subs = await getSurveysByStatus(session.token, 'SUBMITTED').catch(() => []);
          if (subs.length) {
            out.push({
              icon: 'document-text-outline',
              title: `${subs.length} report${subs.length === 1 ? '' : 's'} awaiting review`,
              sub: 'Open the Reports tab to verify or penalise them.',
              tone: 'warn',
            });
          }
        }
        if (role === 'ADMIN') {
          const [pending, subs] = await Promise.all([
            getPendingUsers(session.token).catch(() => []),
            getSurveysByStatus(session.token, 'SUBMITTED').catch(() => []),
          ]);
          pending.forEach((u) =>
            out.push({
              icon: 'person-add-outline',
              title: `New registration: ${u.fullName}`,
              sub: `${u.role} · awaiting your approval`,
              tone: 'accent',
            }),
          );
          if (subs.length) {
            out.push({
              icon: 'document-text-outline',
              title: `${subs.length} new site report${subs.length === 1 ? '' : 's'}`,
              sub: 'Photo evidence submitted from the field.',
              tone: 'good',
            });
          }
        }
        if (role === 'MANAGER') {
          const subs = await getSurveysByStatus(session.token, 'SUBMITTED').catch(() => []);
          out.push({
            icon: 'stats-chart-outline',
            title: 'Operations running',
            sub: `${subs.length} report${subs.length === 1 ? '' : 's'} submitted today · see the dashboard.`,
            tone: 'neutral',
          });
        }
      } finally {
        setItems(out);
        setLoaded(true);
      }
    })();
  }, [session]);

  function toneColor(t: Item['tone']) {
    switch (t) {
      case 'good': return p.goodText;
      case 'warn': return p.warnText;
      case 'accent': return p.accent;
      default: return p.ink2;
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Notifications</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>What needs your attention</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.close, { borderColor: p.line, backgroundColor: p.card }]}
        >
          <Ionicons name="close" size={18} color={p.ink2} />
        </Pressable>
      </View>

      {loaded && items.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Ionicons name="notifications-off-outline" size={26} color={p.ink3} />
          <Text style={{ fontSize: 13, color: p.ink3, marginTop: 10 }}>You're all caught up.</Text>
        </Card>
      )}

      {items.map((it, i) => (
        <Card key={i} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.dot, { backgroundColor: toneColor(it.tone) + '22' }]}>
            <Ionicons name={it.icon} size={18} color={toneColor(it.tone)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: p.ink }}>{it.title}</Text>
            <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 2, lineHeight: 16 }}>{it.sub}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
