import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { Notice, PrimaryButton } from '../components/ui';
import { useTheme } from '../context/theme';
import { register, type Role } from '../lib/api';

const ROLES: Role[] = ['WORKER', 'SUPERVISOR', 'MANAGER'];

export default function Register() {
  const { p } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });
  const [submitted, setSubmitted] = useState(false);

  async function handleRegister() {
    setNotice({ text: '', tone: 'good' });
    if (!fullName || !email || !password) {
      setNotice({ text: 'Full name, email and password are required', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await register({ fullName, email, password, phoneNumber, role });
      const ok = msg.toLowerCase().includes('successful');
      setNotice({ text: msg, tone: ok ? 'good' : 'error' });
      if (ok) setSubmitted(true);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Registration failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: p.screen }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: p.ink }]}>Create your account</Text>
        <Text style={{ fontSize: 12.5, color: p.ink3, marginBottom: 10 }}>
          An admin reviews and approves every registration before first sign-in.
        </Text>

        {submitted ? (
          <View style={{ alignItems: 'center', paddingVertical: 26 }}>
            <Ionicons name="checkmark-circle-outline" size={44} color={p.good} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: p.ink, marginTop: 12 }}>
              Registration received
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                color: p.ink3,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 19,
              }}
            >
              {"Your account is awaiting admin approval.\nYou can sign in once it's approved."}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.label, { color: p.ink3 }]}>FULL NAME</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Kwame Mensah"
              placeholderTextColor={p.ink3}
              style={input}
            />
            <Text style={[styles.label, { color: p.ink3 }]}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@vulcan.com"
              placeholderTextColor={p.ink3}
              style={input}
            />
            <Text style={[styles.label, { color: p.ink3 }]}>PHONE NUMBER</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="024 555 0192"
              placeholderTextColor={p.ink3}
              style={input}
            />
            <Text style={[styles.label, { color: p.ink3 }]}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={p.ink3}
              style={input}
            />

            <Text style={[styles.label, { color: p.ink3 }]}>ROLE</Text>
            <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
              {ROLES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.segBtn, role === r && { backgroundColor: p.accent }]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: role === r ? '#fff' : p.ink3,
                    }}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={busy}
              style={{ marginTop: 18 }}
            />
          </>
        )}

        <Notice text={notice.text} tone={notice.tone} />

        <Pressable onPress={() => router.replace('/sign-in')} style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: p.accent, textAlign: 'center' }}>
            Back to sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  title: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, letterSpacing: 1.6, fontWeight: '600', marginBottom: 7, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
});
