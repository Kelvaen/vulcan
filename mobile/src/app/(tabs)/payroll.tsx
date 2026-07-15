import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  getActiveUsers,
  getPayrollByPeriod,
  payPayroll,
  type ActiveUser,
  type PayrollRecord,
} from '../../lib/api';

const STATUS_META: Record<PayrollRecord['status'], { label: string; key: 'good' | 'warn' | 'neutral' | 'critical' }> = {
  PENDING: { label: 'Pending', key: 'neutral' },
  PAID: { label: 'Paid', key: 'good' },
  FAILED: { label: 'Failed', key: 'critical' },
  EXCLUDED_GHOST_WORKER: { label: 'Ghost — excluded', key: 'warn' },
};

const MOMO_METHODS = ['MTN_MOMO', 'TELECEL_CASH', 'AIRTELTIGO_MONEY'];

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function Payroll() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [period, setPeriod] = useState(currentPeriod());
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  const load = useCallback(async () => {
    if (!session) return;
    setLoaded(false);
    try {
      const [recs, users] = await Promise.all([
        getPayrollByPeriod(session.token, period),
        getActiveUsers(session.token, session.companyId).catch(() => [] as ActiveUser[]),
      ]);
      setRecords(recs);
      setNames(Object.fromEntries(users.map((u) => [u.id, u.fullName])));
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not load payroll', tone: 'error' });
    } finally {
      setLoaded(true);
    }
  }, [session, period]);

  useEffect(() => {
    load();
  }, [load]);

  async function pay(rec: PayrollRecord) {
    if (!session || payingId) return;
    setPayingId(rec.id);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg = await payPayroll(session.token, rec.id);
      const ok = msg.toLowerCase().includes('paid');
      setNotice({ text: msg, tone: ok ? 'good' : 'error' });
      await load();
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Payment failed', tone: 'error' });
    } finally {
      setPayingId(null);
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

  const pending = records.filter((r) => r.status === 'PENDING');
  const totalDue = pending.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Payroll Run</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 14 }}>
        Pay workers to their mobile-money wallets via Paystack
      </Text>

      <Card style={{ marginBottom: 10 }}>
        <Text style={[styles.miniLabel, { color: p.ink3 }]}>PAY PERIOD (YYYY-MM)</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={period}
            onChangeText={setPeriod}
            placeholder="2026-07"
            placeholderTextColor={p.ink3}
            style={[styles.input, { backgroundColor: p.card2, borderColor: p.line, color: p.ink, flex: 1 }]}
          />
          <Pressable onPress={load} style={[styles.reload, { backgroundColor: p.accentSoft, borderColor: 'rgba(233,69,96,0.3)' }]}>
            <Ionicons name="refresh-outline" size={16} color={p.accent} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: p.accent }}>Load</Text>
          </Pressable>
        </View>
        {pending.length > 0 && (
          <Text style={{ fontSize: 12, color: p.ink2, marginTop: 10 }}>
            {pending.length} pending · GH₵ {totalDue.toLocaleString()} due
          </Text>
        )}
      </Card>

      <Notice text={notice.text} tone={notice.tone} />

      {loaded && records.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="cash-outline" size={24} color={p.ink3} />
          <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8 }}>
            No payroll records for {period}.
          </Text>
        </Card>
      )}

      {records.length > 0 && <SectionLabel>Records · {records.length}</SectionLabel>}
      {records.map((r) => {
        const meta = STATUS_META[r.status];
        const c = chip(meta.key);
        const isMomo = MOMO_METHODS.includes(r.paymentMethod);
        return (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: p.ink }}>
                  {names[r.workerId] ?? `Worker #${r.workerId}`}
                </Text>
                <Text style={{ fontSize: 11, color: p.ink3, marginTop: 2 }}>
                  {r.paymentMethod.replace(/_/g, ' ')}
                  {r.momoNumber ? ` · ${r.momoNumber}` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: p.ink }}>
                GH₵ {(r.amount ?? 0).toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
              <View style={[styles.badge, { backgroundColor: c.bg }]}>
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: c.color }}>{meta.label}</Text>
              </View>
              <View style={{ flex: 1 }} />
              {r.status === 'PENDING' && (
                <Pressable
                  disabled={payingId === r.id}
                  onPress={() => pay(r)}
                  style={[styles.payBtn, { backgroundColor: p.accent, opacity: payingId === r.id ? 0.6 : 1 }]}
                >
                  <Ionicons name={isMomo ? 'phone-portrait-outline' : 'card-outline'} size={14} color="#fff" />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff' }}>
                    {payingId === r.id ? 'Paying…' : isMomo ? 'Pay to MoMo' : 'Mark paid'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  miniLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '700' },
  reload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
  },
  badge: { borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
});
