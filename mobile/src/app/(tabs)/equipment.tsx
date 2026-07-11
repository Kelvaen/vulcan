import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, StatusChip } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getEquipment, type Equipment, type EquipmentState } from '../../lib/api';

const STATE_META: Record<EquipmentState, { label: string; key: 'good' | 'warn' | 'serious' | 'critical' | 'neutral' }> = {
  AVAILABLE: { label: 'Available', key: 'good' },
  IN_USE: { label: 'In use', key: 'neutral' },
  UNDER_REPAIR: { label: 'Under repair', key: 'warn' },
  DAMAGED: { label: 'Damaged', key: 'serious' },
  DECOMMISSIONED: { label: 'Decommissioned', key: 'critical' },
};

const FILTERS: Array<{ label: string; value: 'all' | EquipmentState }> = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'In use', value: 'IN_USE' },
  { label: 'Repair', value: 'UNDER_REPAIR' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Retired', value: 'DECOMMISSIONED' },
];

export default function EquipmentScreen() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | EquipmentState>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setError('');
      setItems(await getEquipment(session.token));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load equipment');
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = items.filter((i) => filter === 'all' || i.state === filter);

  function chipColors(key: string): { color: string; bg: string } {
    switch (key) {
      case 'good':
        return { color: p.goodText, bg: 'rgba(12,163,12,0.13)' };
      case 'warn':
        return { color: p.warnText, bg: 'rgba(250,178,25,0.13)' };
      case 'serious':
        return { color: p.seriousText, bg: 'rgba(236,131,90,0.13)' };
      case 'critical':
        return { color: p.criticalText, bg: 'rgba(208,59,59,0.13)' };
      default:
        return { color: p.ink2, bg: p.track };
    }
  }

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
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Equipment</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
            {items.length} assets · live from equipment-service
          </Text>
        </View>
        <Pressable style={[styles.scan, { backgroundColor: p.accentSoft, borderColor: 'rgba(233,69,96,0.3)' }]}>
          <Ionicons name="qr-code-outline" size={15} color={p.accent} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: p.accent }}>Scan ID</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.fchip,
                  { backgroundColor: active ? p.ink : p.card, borderColor: active ? p.ink : p.line },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: active ? p.screen : p.ink2 }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {error ? (
        <Card>
          <Text style={{ color: p.accent, fontSize: 13, fontWeight: '600' }}>{error}</Text>
          <Text style={{ color: p.ink3, fontSize: 11.5, marginTop: 4 }}>
            Is the equipment-service (8084) running?
          </Text>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <Text style={{ color: p.ink3, fontSize: 13 }}>No equipment in this state.</Text>
        </Card>
      ) : (
        visible.map((e) => {
          const meta = STATE_META[e.state] ?? { label: e.state, key: 'neutral' as const };
          const c = chipColors(meta.key);
          return (
            <Card key={e.id} style={[styles.item, { marginBottom: 8 }]}>
              <View style={[styles.icon, { backgroundColor: p.track }]}>
                <Ionicons name="construct-outline" size={19} color={p.ink2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: p.ink }}>{e.name}</Text>
                <Text style={{ fontSize: 10.5, color: p.ink3, marginTop: 3 }}>
                  {e.equipmentCode} · Site {e.siteId}
                </Text>
              </View>
              <StatusChip label={meta.label} color={c.color} bg={c.bg} />
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  fchip: { borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
