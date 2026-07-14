import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, PrimaryButton, StatusChip } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  createEquipment,
  getEquipment,
  getSites,
  getWorkerSite,
  updateEquipmentState,
  type Equipment,
  type EquipmentState,
  type Site,
} from '../../lib/api';

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
  const role = session?.role;
  const isAdmin = role === 'ADMIN';
  const canEditState = role === 'SUPERVISOR' || role === 'ADMIN';
  // Supervisors and workers see only their own site's assets; admins/managers see all.
  const scopedToSite = role === 'SUPERVISOR' || role === 'WORKER';

  const [items, setItems] = useState<Equipment[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | EquipmentState>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [mySiteId, setMySiteId] = useState<number | null>(null);

  // admin add-equipment form
  const [sites, setSites] = useState<Site[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addType, setAddType] = useState('');
  const [addSite, setAddSite] = useState<Site | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  async function changeState(item: Equipment, state: EquipmentState) {
    if (!session || savingId) return;
    setSavingId(item.id);
    const prev = item.state;
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, state } : x)));
    try {
      await updateEquipmentState(session.token, item.id, state);
      setExpandedId(null);
    } catch {
      setItems((list) => list.map((x) => (x.id === item.id ? { ...x, state: prev } : x)));
      setError('Could not update state — try again');
    } finally {
      setSavingId(null);
    }
  }

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setError('');
      const [all, resolvedSite] = await Promise.all([
        getEquipment(session.token),
        scopedToSite && session.userId != null
          ? getWorkerSite(session.token, session.userId)
          : Promise.resolve(null),
      ]);
      setMySiteId(resolvedSite?.id ?? null);
      setItems(all);
      if (isAdmin) {
        try {
          setSites(await getSites(session.token));
        } catch {
          /* ignore */
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not load equipment');
    }
  }, [session, scopedToSite, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitEquipment() {
    if (!session) return;
    if (!addName || !addCode || !addSite) {
      setNotice({ text: 'Name, code and site are required', tone: 'warn' });
      return;
    }
    setAdding(true);
    try {
      const msg = await createEquipment(session.token, {
        equipmentCode: addCode,
        name: addName,
        type: addType || 'General',
        siteId: addSite.id,
      });
      const ok = msg.toLowerCase().includes('success');
      setNotice({ text: msg, tone: ok ? 'good' : 'error' });
      if (ok) {
        setAddName(''); setAddCode(''); setAddType(''); setAddSite(null);
        setShowAdd(false);
        await load();
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not add equipment', tone: 'error' });
    } finally {
      setAdding(false);
    }
  }

  const visible = items
    .filter((i) => !scopedToSite || mySiteId == null || i.siteId === mySiteId)
    .filter((i) => filter === 'all' || i.state === filter);

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
            {scopedToSite ? 'Your site · ' : ''}{visible.length} of {items.length} assets
          </Text>
        </View>
        {isAdmin && (
          <Pressable
            onPress={() => setShowAdd((v) => !v)}
            style={[styles.scan, { backgroundColor: p.accentSoft, borderColor: 'rgba(233,69,96,0.3)' }]}
          >
            <Ionicons name={showAdd ? 'close' : 'add'} size={16} color={p.accent} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: p.accent }}>
              {showAdd ? 'Cancel' : 'Add'}
            </Text>
          </Pressable>
        )}
      </View>

      <Notice text={notice.text} tone={notice.tone} />

      {isAdmin && showAdd && (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.miniLabel, { color: p.ink3 }]}>ASSET NAME</Text>
          <TextInput value={addName} onChangeText={setAddName} placeholder="CAT 320 Excavator" placeholderTextColor={p.ink3} style={[styles.input, { backgroundColor: p.card2, borderColor: p.line, color: p.ink }]} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>CODE</Text>
              <TextInput value={addCode} onChangeText={setAddCode} autoCapitalize="characters" placeholder="VLC-EQ-0100" placeholderTextColor={p.ink3} style={[styles.input, { backgroundColor: p.card2, borderColor: p.line, color: p.ink }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>TYPE</Text>
              <TextInput value={addType} onChangeText={setAddType} placeholder="Excavator" placeholderTextColor={p.ink3} style={[styles.input, { backgroundColor: p.card2, borderColor: p.line, color: p.ink }]} />
            </View>
          </View>
          <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>ASSIGN TO SITE</Text>
          <View style={styles.wrap}>
            {sites.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setAddSite(s)}
                style={[styles.pchip, { borderColor: p.line, backgroundColor: addSite?.id === s.id ? p.accent : p.card2 }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: addSite?.id === s.id ? '#fff' : p.ink2 }}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton title="Register Equipment" onPress={submitEquipment} loading={adding} style={{ marginTop: 12 }} />
        </Card>
      )}

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
          const expanded = expandedId === e.id;
          return (
            <Pressable key={e.id} onPress={() => canEditState && setExpandedId(expanded ? null : e.id)}>
              <Card style={{ marginBottom: 8 }}>
                <View style={styles.item}>
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
                </View>
                {expanded && (
                  <View style={styles.stateRow}>
                    <Text style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: p.ink3, width: '100%' }}>
                      SET STATE
                    </Text>
                    {(Object.keys(STATE_META) as EquipmentState[])
                      .filter((s) => s !== e.state)
                      .map((s) => {
                        const sc = chipColors(STATE_META[s].key);
                        return (
                          <Pressable
                            key={s}
                            disabled={savingId === e.id}
                            onPress={() => changeState(e, s)}
                            style={[styles.stateBtn, { backgroundColor: sc.bg, opacity: savingId === e.id ? 0.5 : 1 }]}
                          >
                            <Text style={{ fontSize: 11.5, fontWeight: '700', color: sc.color }}>
                              {STATE_META[s].label}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                )}
              </Card>
            </Pressable>
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
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  stateBtn: { borderRadius: 100, paddingVertical: 7, paddingHorizontal: 13 },
  miniLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  pchip: { borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
