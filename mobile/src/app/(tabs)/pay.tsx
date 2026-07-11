import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getWorkerPayroll } from '../../lib/api';

export default function Pay() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    getWorkerPayroll(session.token, session.userId ?? 2)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [session]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Payroll</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 16 }}>
        Week 28 · 6 – 12 July
      </Text>

      <View style={[styles.wallet, { backgroundColor: p.accent }]}>
        <Text style={styles.walletOv}>NEXT PAYOUT · FRI 17 JULY</Text>
        <Text style={styles.walletAmt}>GH₵ 1,240.00</Text>
        <View style={styles.walletMeta}>
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12 }}>MTN MoMo ···· 4521</Text>
          <View style={styles.walletBadge}>
            <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>AUTO-PAY</Text>
          </View>
        </View>
      </View>

      <View style={[styles.ghost, { borderColor: 'rgba(250,178,25,0.35)', backgroundColor: 'rgba(250,178,25,0.09)' }]}>
        <Ionicons name="warning-outline" size={19} color={p.warnText} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: p.warnText }}>
            Ghost-worker check — automatic
          </Text>
          <Text style={{ fontSize: 12, color: p.ink2, lineHeight: 18, marginTop: 4 }}>
            Workers absent 60+ days without reason are auto-excluded from pay runs and flagged for
            review.
          </Text>
        </View>
      </View>

      <SectionLabel>Payment history {loaded && records.length > 0 ? '· live' : ''}</SectionLabel>
      {records.length > 0 ? (
        records.map((r, i) => (
          <Card key={r.id ?? i} style={[styles.row, { marginBottom: 8 }]}>
            <View style={[styles.icon, { backgroundColor: p.track }]}>
              <Ionicons name="card-outline" size={17} color={p.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: p.ink }}>
                Pay run — {r.payPeriod ?? '—'}
              </Text>
              <Text style={{ fontSize: 11, color: p.ink3, marginTop: 2 }}>
                {r.paymentMethod ?? 'Mobile money'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: p.ink }}>
                GH₵ {Number(r.amount ?? 0).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: p.goodText, marginTop: 2 }}>
                {r.status ?? 'PENDING'}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={{ color: p.ink3, fontSize: 13, lineHeight: 19 }}>
            {loaded
              ? 'No pay runs for this worker yet — payroll records appear here once the supervisor creates a pay run.'
              : 'Loading payment history…'}
          </Text>
        </Card>
      )}

      <Text style={{ fontSize: 11, color: p.ink3, lineHeight: 18, marginTop: 12, paddingHorizontal: 4 }}>
        Mobile money first — bank transfer and physical cheque remain available for workers who
        prefer them.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wallet: { borderRadius: 20, padding: 22 },
  walletOv: { color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  walletAmt: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 10 },
  walletMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  ghost: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginTop: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
