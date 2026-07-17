import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SiteBackdrop from '../../components/SiteBackdrop';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getDashboard, type EquipmentState } from '../../lib/api';

const WEEK = [
  { d: 'Mon', v: 118 },
  { d: 'Tue', v: 121 },
  { d: 'Wed', v: 109 },
  { d: 'Thu', v: 124 },
  { d: 'Fri', v: 128 },
  { d: 'Sat', v: 96 },
];
const ROSTER = 143;

export default function Dashboard() {
  const { p } = useTheme();
  const { session, initials } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    getDashboard(session.token, period)
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Could not load dashboard'));
  }, [session]);

  const equipment: Array<{ state: EquipmentState }> = data?.equipment ?? [];
  const sites: any[] = data?.sites ?? [];
  const stateCount = (s: EquipmentState) => equipment.filter((e) => e.state === s).length;
  const legend = [
    { label: 'Available', n: stateCount('AVAILABLE'), color: p.good },
    { label: 'In use', n: stateCount('IN_USE'), color: p.bar },
    { label: 'Under repair', n: stateCount('UNDER_REPAIR'), color: p.warn },
    { label: 'Damaged', n: stateCount('DAMAGED'), color: p.serious },
    { label: 'Decommissioned', n: stateCount('DECOMMISSIONED'), color: p.critical },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: p.screen }}>
      <SiteBackdrop opacity={0.05} height={170} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
      >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Site Analytics</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
            {data ? 'All sites · live from analytics-service' : error ? 'offline' : 'loading…'}
          </Text>
        </View>
        <View style={[styles.roleChip, { backgroundColor: p.accentSoft }]}>
          <Text style={{ fontSize: 10.5, fontWeight: '700', color: p.accent }}>
            {session?.role ?? ''}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={[styles.iconBtn, { backgroundColor: p.card, borderColor: p.line }]}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={p.ink2} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/profile')}
          style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}
          accessibilityLabel="Profile and settings"
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: p.ink2 }}>{initials}</Text>
        </Pressable>
      </View>

      <View style={styles.kpis}>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiV, { color: p.ink }]}>
            {sites.length}
            <Text style={{ fontSize: 12, color: p.ink3 }}> sites</Text>
          </Text>
          <Text style={[styles.kpiK, { color: p.ink3 }]}>ACTIVE SITES</Text>
        </Card>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiV, { color: p.ink }]}>{equipment.length}</Text>
          <Text style={[styles.kpiK, { color: p.ink3 }]}>ASSETS TRACKED</Text>
        </Card>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiV, { color: p.ink }]}>{data?.payrollSummary?.length ?? 0}</Text>
          <Text style={[styles.kpiK, { color: p.ink3 }]}>PAY RECORDS · MONTH</Text>
        </Card>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiV, { color: p.ink }]}>{data?.pendingSurveys?.length ?? 0}</Text>
          <Text style={[styles.kpiK, { color: p.ink3 }]}>PENDING SURVEYS</Text>
        </Card>
      </View>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: p.ink3 }]}>ATTENDANCE — THIS WEEK</Text>
        <View style={styles.chart}>
          <View style={[styles.capLine, { borderColor: p.track }]} />
          {WEEK.map((w) => (
            <View key={w.d} style={styles.barCol}>
              {w.d === 'Fri' && (
                <Text style={{ fontSize: 10, fontWeight: '800', color: p.ink, marginBottom: 3 }}>
                  {w.v}
                </Text>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: p.bar,
                    height: (w.v / ROSTER) * 110,
                    opacity: w.d === 'Sat' ? 0.45 : 1,
                  },
                ]}
              />
              <Text style={{ fontSize: 9.5, color: p.ink3, marginTop: 6 }}>{w.d}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 9, color: p.ink3, textAlign: 'right' }}>{ROSTER} rostered</Text>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: p.ink3 }]}>
          EQUIPMENT STATUS · {equipment.length} ASSETS
        </Text>
        {legend.map((l) => (
          <View key={l.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={{ flex: 1, fontSize: 12.5, color: p.ink2 }}>{l.label}</Text>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: p.ink }}>{l.n}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: p.ink3 }]}>SITES</Text>
        {sites.length === 0 ? (
          <Text style={{ fontSize: 12.5, color: p.ink3 }}>{error || 'No sites yet.'}</Text>
        ) : (
          sites.map((s) => (
            <View key={s.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12.5, color: p.ink }}>{s.name}</Text>
                <Text style={{ fontSize: 11, color: p.ink3 }}>{s.location}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: p.track }]}>
                <View style={[styles.fill, { backgroundColor: p.bar, width: '72%' }]} />
              </View>
            </View>
          ))
        )}
      </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  roleChip: { borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 },
  kpi: { width: '48%', flexGrow: 1 },
  kpiV: { fontSize: 23, fontWeight: '800' },
  kpiK: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginTop: 4 },
  cardTitle: { fontSize: 10.5, letterSpacing: 1.6, fontWeight: '700', marginBottom: 14 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 140,
    paddingTop: 16,
  },
  capLine: { position: 'absolute', top: 12, left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
