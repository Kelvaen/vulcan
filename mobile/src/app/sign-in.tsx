import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
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
import { PrimaryButton, Notice } from '../components/ui';
import { landingFor, useAuth } from '../context/auth';
import { useTheme } from '../context/theme';

// Dev convenience — the two accounts seeded/created during backend bring-up.
const DEMO_ACCOUNTS = [
  { label: 'Worker demo', email: 'yaw@vulcan.com', password: 'worker123' },
  { label: 'Admin demo', email: 'kelvin@vulcan.com', password: 'vulcan2026' },
];

export default function SignIn() {
  const { p, mode, toggle } = useTheme();
  const { session, signIn, hydrated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (hydrated && session) {
    return <Redirect href={landingFor(session.role)} />;
  }

  async function handleSignIn() {
    setError('');
    if (!email || !password) {
      setError('Enter your email and password');
      return;
    }
    setBusy(true);
    try {
      const s = await signIn(email, password);
      router.replace(landingFor(s.role));
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: p.screen }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable
        onPress={toggle}
        style={[styles.themeFab, { borderColor: p.line, backgroundColor: p.card }]}
        accessibilityLabel="Toggle light/dark mode"
      >
        <Ionicons name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={p.ink2} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lockup}>
          <View style={[styles.hex, { borderColor: p.accent }]}>
            <Text style={[styles.hexV, { color: p.ink }]}>V</Text>
          </View>
          <Text style={[styles.wordmark, { color: p.ink }]}>VULCAN</Text>
          <Text style={[styles.tagline, { color: p.ink3 }]}>FIELD & MINERAL INTELLIGENCE</Text>
        </View>

        <Text style={[styles.label, { color: p.ink3 }]}>EMAIL</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@vulcan.com"
          placeholderTextColor={p.ink3}
          style={[styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }]}
        />
        <Text style={[styles.label, { color: p.ink3 }]}>PASSWORD</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={p.ink3}
          style={[styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }]}
          onSubmitEditing={handleSignIn}
        />

        <PrimaryButton title="Sign In" onPress={handleSignIn} loading={busy} style={{ marginTop: 18 }} />
        <Notice text={error} tone="error" />

        <View style={styles.demoRow}>
          {DEMO_ACCOUNTS.map((d) => (
            <Pressable
              key={d.label}
              onPress={() => {
                setEmail(d.email);
                setPassword(d.password);
                setError('');
              }}
              style={[styles.demoChip, { backgroundColor: p.card, borderColor: p.line }]}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '600', color: p.ink2 }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.foot, { color: p.ink3 }]}>
          Offline-first · syncs over 2G when back in range{'\n'}
          Identity confirmed daily by facial verification
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  themeFab: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockup: { alignItems: 'center', marginBottom: 34 },
  hex: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderRadius: 18,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexV: { fontSize: 26, fontWeight: '800', transform: [{ rotate: '-45deg' }] },
  wordmark: { fontSize: 27, fontWeight: '800', letterSpacing: 10, marginTop: 18, marginLeft: 10 },
  tagline: { fontSize: 10, letterSpacing: 3.5, marginTop: 6 },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  demoRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 22 },
  demoChip: { borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  foot: { fontSize: 11, textAlign: 'center', lineHeight: 19, marginTop: 22 },
});
