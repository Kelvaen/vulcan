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
import { register, registerCompany, type Role } from '../lib/api';

const ROLES: Role[] = ['WORKER', 'SUPERVISOR', 'MANAGER', 'ADMIN'];
type Mode = 'join' | 'create';

export default function Register() {
  const { p } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('join');

  const [companyName, setCompanyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
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
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  async function handleJoin() {
    setNotice({ text: '', tone: 'good' });
    if (!fullName || !email || !password || !joinCode) {
      setNotice({ text: 'Company code, name, email and password are required', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await register({
        fullName,
        email,
        password,
        phoneNumber,
        role,
        joinCode: joinCode.trim().toUpperCase(),
      });
      const ok = msg.toLowerCase().includes('successful');
      if (ok) setDoneMsg(msg);
      else setNotice({ text: msg, tone: 'error' });
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Registration failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    setNotice({ text: '', tone: 'good' });
    if (!companyName || !fullName || !email || !password) {
      setNotice({ text: 'Company, name, email and password are required', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await registerCompany({ companyName, fullName, email, password, phoneNumber });
      const ok = msg.toLowerCase().includes('created');
      if (ok) setDoneMsg(msg);
      else setNotice({ text: msg, tone: 'error' });
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not create company', tone: 'error' });
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
        {doneMsg ? (
          <View style={{ alignItems: 'center', paddingVertical: 26 }}>
            <Ionicons name="checkmark-circle-outline" size={46} color={p.good} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: p.ink, marginTop: 12 }}>
              {mode === 'create' ? 'Company created' : 'Registration received'}
            </Text>
            <Text style={{ fontSize: 13, color: p.ink2, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              {doneMsg}
            </Text>
            <PrimaryButton
              title="Go to sign in"
              onPress={() => router.replace('/sign-in')}
              style={{ marginTop: 22, alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: p.ink }]}>
              {mode === 'create' ? 'Register your company' : 'Join your company'}
            </Text>
            <Text style={{ fontSize: 12.5, color: p.ink3, marginBottom: 12 }}>
              {mode === 'create'
                ? "You'll become the company admin and get a code to invite your team."
                : 'Enter the company code your admin shared with you.'}
            </Text>

            <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
              {(
                [
                  ['join', 'Join a company'],
                  ['create', 'Create a company'],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setNotice({ text: '', tone: 'good' });
                  }}
                  style={[styles.segBtn, mode === m && { backgroundColor: p.accent }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mode === m ? '#fff' : p.ink3 }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'create' ? (
              <>
                <Text style={[styles.label, { color: p.ink3 }]}>COMPANY NAME</Text>
                <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Ashanti Gold Ltd" placeholderTextColor={p.ink3} style={input} />
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: p.ink3 }]}>COMPANY CODE</Text>
                <TextInput
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  placeholder="e.g. BY6REW"
                  placeholderTextColor={p.ink3}
                  style={[...input, { letterSpacing: 3, fontWeight: '800' }]}
                />
              </>
            )}

            <Text style={[styles.label, { color: p.ink3 }]}>FULL NAME</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Kwame Mensah" placeholderTextColor={p.ink3} style={input} />
            <Text style={[styles.label, { color: p.ink3 }]}>EMAIL</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" placeholderTextColor={p.ink3} style={input} />
            <Text style={[styles.label, { color: p.ink3 }]}>PHONE NUMBER</Text>
            <TextInput value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="024 555 0192" placeholderTextColor={p.ink3} style={input} />
            <Text style={[styles.label, { color: p.ink3 }]}>PASSWORD</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={p.ink3} style={input} />

            {mode === 'join' && (
              <>
                <Text style={[styles.label, { color: p.ink3 }]}>ROLE</Text>
                <View style={styles.wrap}>
                  {ROLES.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      style={[styles.roleChip, { borderColor: p.line, backgroundColor: role === r ? p.accent : p.card }]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: role === r ? '#fff' : p.ink3 }}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <PrimaryButton
              title={mode === 'create' ? 'Create Company' : 'Register'}
              onPress={mode === 'create' ? handleCreate : handleJoin}
              loading={busy}
              style={{ marginTop: 18 }}
            />
            <Notice text={notice.text} tone={notice.tone} />
          </>
        )}

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
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4, marginBottom: 6 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  label: { fontSize: 11, letterSpacing: 1.6, fontWeight: '600', marginBottom: 7, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  roleChip: { borderWidth: 1, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14 },
});
