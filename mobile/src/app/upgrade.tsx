import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Notice, PrimaryButton } from '../components/ui';
import { useAuth } from '../context/auth';
import { useTheme } from '../context/theme';
import { getPremiumPrice, upgradeInit, upgradeVerify, type PremiumPrice } from '../lib/api';

const PERKS = [
  'Unlimited workers, supervisors and admins',
  'Everything in Free, with no seat caps',
  'Priority support for your company',
];

function formatPrice(p: PremiumPrice): string {
  const major = (p.amount / 100).toLocaleString();
  const symbol = p.currency === 'GHS' ? 'GH₵' : p.currency + ' ';
  return `${symbol}${major}`;
}

export default function Upgrade() {
  const { p } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const companyId = session?.companyId ?? null;

  const [price, setPrice] = useState<PremiumPrice | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  useEffect(() => {
    if (!session) return;
    getPremiumPrice(session.token).then(setPrice).catch(() => {});
  }, [session]);

  async function pay() {
    if (!session || companyId == null) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const init = await upgradeInit(session.token, companyId, session.email);
      if (init.alreadyPremium) {
        setDone(true);
        return;
      }
      // Mock mode (no Paystack key): payment is simulated, so verify immediately.
      if (init.mock || !init.authorizationUrl) {
        const res = await upgradeVerify(session.token, companyId, init.reference);
        if (res.success) setDone(true);
        else setNotice({ text: res.message, tone: 'warn' });
        return;
      }
      // Live mode: open Paystack's hosted checkout, then let the user confirm.
      setReference(init.reference);
      setAwaitingPayment(true);
      await Linking.openURL(init.authorizationUrl);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not start payment', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment() {
    if (!session || companyId == null || !reference) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const res = await upgradeVerify(session.token, companyId, reference);
      if (res.success) setDone(true);
      else setNotice({ text: res.message, tone: 'warn' });
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not verify payment', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Upgrade to Premium</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>More seats for your growing team</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.close, { borderColor: p.line, backgroundColor: p.card }]}
        >
          <Ionicons name="close" size={18} color={p.ink2} />
        </Pressable>
      </View>

      {done ? (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Ionicons name="checkmark-circle" size={40} color={p.good} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: p.ink, marginTop: 12 }}>
            You&apos;re on Premium
          </Text>
          <Text style={{ fontSize: 12.5, color: p.ink3, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
            {"Seat limits are lifted for your whole company.\nApprove as many employees as you need."}
          </Text>
          <PrimaryButton
            title="Done"
            onPress={() => {
              router.back();
            }}
            style={{ marginTop: 20, alignSelf: 'stretch' }}
          />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ fontSize: 34, fontWeight: '800', color: p.ink }}>
                {price ? formatPrice(price) : '—'}
              </Text>
              <Text style={{ fontSize: 13, color: p.ink3, marginBottom: 6 }}>/ month</Text>
            </View>
            {PERKS.map((perk) => (
              <View key={perk} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 }}>
                <Ionicons name="checkmark-circle" size={17} color={p.good} />
                <Text style={{ fontSize: 13, color: p.ink2, flex: 1 }}>{perk}</Text>
              </View>
            ))}
          </Card>

          {price?.mock && (
            <Text style={{ fontSize: 11, color: p.ink3, marginBottom: 10, paddingHorizontal: 4 }}>
              Demo mode — payment is simulated (no Paystack key configured).
            </Text>
          )}

          {awaitingPayment ? (
            <>
              <Notice text="Complete the payment in the Paystack window, then confirm below." tone="warn" />
              <PrimaryButton title="I've paid — confirm" onPress={confirmPayment} loading={busy} style={{ marginTop: 4 }} />
            </>
          ) : (
            <PrimaryButton
              title={price?.mock ? 'Upgrade now (demo)' : 'Pay with Paystack'}
              onPress={pay}
              loading={busy}
              style={{ marginTop: 4 }}
            />
          )}
          <Notice text={notice.text} tone={notice.tone} />
        </>
      )}
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
});
