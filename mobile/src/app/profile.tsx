import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../context/auth';
import { useTheme } from '../context/theme';

export default function Profile() {
  const { p, mode, toggle } = useTheme();
  const { session, displayName, initials, signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { backgroundColor: p.screen }]}>
      <View style={[styles.grip, { backgroundColor: p.track }]} />

      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: p.ink2 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: p.ink }}>{displayName || 'Signed out'}</Text>
          <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 2 }}>
            {session ? `${session.role} · ${session.email}` : '—'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={toggle}
        style={[styles.row, { backgroundColor: p.card2, borderColor: p.line }]}
      >
        <Ionicons name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={p.ink2} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: p.ink }}>Appearance</Text>
        <View style={[styles.pill, { backgroundColor: p.accentSoft }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: p.accent }}>
            {mode === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </View>
      </Pressable>

      {session?.companyId != null && (
        <Pressable
          onPress={() => {
            router.back();
            router.push('/company');
          }}
          style={[styles.row, { backgroundColor: p.card2, borderColor: p.line }]}
        >
          <Ionicons name="business-outline" size={18} color={p.ink2} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: p.ink }}>Company & Plan</Text>
          <Ionicons name="chevron-forward" size={16} color={p.ink3} style={{ marginLeft: 'auto' }} />
        </Pressable>
      )}

      <View style={[styles.row, { backgroundColor: p.card2, borderColor: p.line }]}>
        <Ionicons name="checkmark" size={18} color={p.good} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: p.ink }}>Offline queue</Text>
          <Text style={{ fontSize: 10.5, color: p.ink3, marginTop: 2 }}>
            All changes synced · last sync just now
          </Text>
        </View>
      </View>

      <PrimaryButton
        title="Log Out"
        variant="danger"
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
        style={{ marginTop: 10 }}
      />

      <PrimaryButton title="Close" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 22, paddingTop: 14 },
  grip: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 18 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  pill: { marginLeft: 'auto', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 13 },
});
