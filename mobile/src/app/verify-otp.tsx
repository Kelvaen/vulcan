import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SiteBackdrop from '../components/SiteBackdrop';
import { Notice, PrimaryButton } from '../components/ui';
import { landingFor, useAuth } from '../context/auth';
import { useTheme } from '../context/theme';
import { resendOtp, verifyOtp, type OtpPurpose } from '../lib/api';

export default function VerifyOtp() {
  const { p } = useTheme();
  const { completeLogin } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; purpose: string; devCode?: string }>();

  const email = String(params.email ?? '');
  const purpose: OtpPurpose = params.purpose === 'SIGNUP' ? 'SIGNUP' : 'LOGIN';

  const [code, setCode] = useState(String(params.devCode ?? ''));
  const [devCode, setDevCode] = useState(String(params.devCode ?? ''));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  const title = purpose === 'SIGNUP' ? 'Verify your email' : 'Enter your login code';
  const blurb =
    purpose === 'SIGNUP'
      ? `We sent a 6-digit code to ${email}. Enter it to verify your email.`
      : `We sent a 6-digit code to ${email}. Enter it to finish signing in.`;

  async function submit() {
    if (code.trim().length < 4) {
      setNotice({ text: 'Enter the 6-digit code', tone: 'warn' });
      return;
    }
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const r = await verifyOtp(email, code.trim(), purpose);
      if (r.status === 'OK' && r.token) {
        const s = completeLogin(r.token, email);
        router.replace(landingFor(s.role));
        return;
      }
      if (r.status === 'VERIFIED') {
        setNotice({ text: r.message || 'Email verified. Please sign in.', tone: 'good' });
        setTimeout(() => router.replace('/sign-in'), 900);
        return;
      }
      if (r.status === 'PENDING') {
        setNotice({ text: r.message, tone: 'warn' });
        setTimeout(() => router.replace('/sign-in'), 1400);
        return;
      }
      setNotice({ text: r.message || 'Invalid or expired code', tone: 'error' });
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not verify the code', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setNotice({ text: '', tone: 'good' });
    try {
      const r = await resendOtp(email, purpose);
      if (r.devCode) {
        setDevCode(r.devCode);
        setCode(r.devCode);
      }
      setNotice({ text: r.message || 'A new code is on its way.', tone: 'good' });
    } catch {
      setNotice({ text: 'Could not resend the code', tone: 'error' });
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: p.screen }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SiteBackdrop opacity={0.09} height={230} />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hex, { borderColor: p.accent }]}>
          <Ionicons name="mail-unread-outline" size={24} color={p.accent} style={{ transform: [{ rotate: '-45deg' }] }} />
        </View>

        <Text style={[styles.title, { color: p.ink }]}>{title}</Text>
        <Text style={[styles.blurb, { color: p.ink3 }]}>{blurb}</Text>

        <Text style={[styles.label, { color: p.ink3 }]}>6-DIGIT CODE</Text>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="123456"
          placeholderTextColor={p.ink3}
          maxLength={6}
          style={[styles.codeInput, { backgroundColor: p.card, borderColor: p.line, color: p.ink }]}
          onSubmitEditing={submit}
        />

        {!!devCode && (
          <View style={[styles.devHint, { backgroundColor: p.card, borderColor: p.line }]}>
            <Ionicons name="information-circle-outline" size={15} color={p.ink3} />
            <Text style={{ flex: 1, fontSize: 11.5, color: p.ink3, lineHeight: 16 }}>
              No email account is configured, so we filled in your code ({devCode}) for testing. Add a
              BREVO_API_KEY to send real emails.
            </Text>
          </View>
        )}

        <PrimaryButton
          title={purpose === 'SIGNUP' ? 'Verify Email' : 'Sign In'}
          onPress={submit}
          loading={busy}
          style={{ marginTop: 16 }}
        />
        <Notice text={notice.text} tone={notice.tone} />

        <Pressable onPress={resend} style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: p.accent, textAlign: 'center' }}>
            Didn&apos;t get it? Resend code
          </Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/sign-in')} style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 12.5, color: p.ink3, textAlign: 'center' }}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  hex: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderWidth: 3,
    borderRadius: 18,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  blurb: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19, paddingHorizontal: 8 },
  label: { fontSize: 11, letterSpacing: 1.6, fontWeight: '600', marginBottom: 7, marginTop: 24 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  devHint: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
    alignItems: 'flex-start',
  },
});
