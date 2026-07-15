import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui';
import { useAuth } from '../context/auth';
import { useTheme } from '../context/theme';
import { getCompany, type CompanyInfo, type Role } from '../lib/api';

const ROLE_LABEL: Record<Role, string> = {
  WORKER: 'Workers',
  SUPERVISOR: 'Supervisors',
  MANAGER: 'Managers',
  ADMIN: 'Admins',
};

export default function Company() {
  const { p } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const isAdmin = session?.role === 'ADMIN';
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return; // still hydrating — don't flag an error yet
    if (session.companyId == null) {
      setError('No company linked to this account');
      return;
    }
    setError('');
    getCompany(session.token, session.companyId)
      .then(setInfo)
      .catch((e) => setError(e?.message ?? 'Could not load company'));
  }, [session]);

  const premium = info?.plan === 'PREMIUM';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Company & Plan</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
            {info?.name ?? 'Loading…'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.close, { borderColor: p.line, backgroundColor: p.card }]}
        >
          <Ionicons name="close" size={18} color={p.ink2} />
        </Pressable>
      </View>

      {error ? (
        <Card>
          <Text style={{ color: p.accent, fontSize: 13, fontWeight: '600' }}>{error}</Text>
        </Card>
      ) : !info ? (
        <Card>
          <Text style={{ color: p.ink3, fontSize: 13 }}>Loading company…</Text>
        </Card>
      ) : (
        <>
          {/* Plan card */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.4, color: p.ink3, fontWeight: '700' }}>
                  CURRENT PLAN
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink, marginTop: 4 }}>
                  {premium ? 'Premium' : 'Free'}
                </Text>
              </View>
              <View
                style={[
                  styles.planBadge,
                  { backgroundColor: premium ? 'rgba(12,163,12,0.13)' : p.track },
                ]}
              >
                <Ionicons
                  name={premium ? 'star' : 'star-outline'}
                  size={16}
                  color={premium ? p.goodText : p.ink3}
                />
              </View>
            </View>
            {isAdmin && !premium && (
              <Pressable
                onPress={() => router.push('/upgrade')}
                style={[styles.upgrade, { backgroundColor: p.accent }]}
              >
                <Ionicons name="rocket-outline" size={16} color="#fff" />
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#fff' }}>
                  Upgrade to Premium
                </Text>
              </Pressable>
            )}
          </Card>

          {/* Join code — admins share this to onboard the team */}
          <Card style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.4, color: p.ink3, fontWeight: '700' }}>
              COMPANY JOIN CODE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 30, fontWeight: '800', color: p.ink, letterSpacing: 6, flex: 1 }}>
                {info.joinCode}
              </Text>
              <Pressable
                onPress={() =>
                  Share.share({
                    message: `Join ${info.name} on Vulcan. Use company code ${info.joinCode} when you register.`,
                  })
                }
                style={[styles.share, { backgroundColor: p.accentSoft, borderColor: 'rgba(233,69,96,0.3)' }]}
              >
                <Ionicons name="share-outline" size={15} color={p.accent} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: p.accent }}>Share</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 8, lineHeight: 16 }}>
              Employees enter this code when they register to join your company.
            </Text>
          </Card>

          {/* Usage per role */}
          <Text style={[styles.section, { color: p.ink3 }]}>SEATS USED</Text>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
            const u = info.usage[r] ?? { active: 0, limit: 0 };
            const pct = u.limit > 0 ? Math.min(1, u.active / u.limit) : 0;
            const full = u.active >= u.limit;
            return (
              <Card key={r} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: p.ink, flex: 1 }}>
                    {ROLE_LABEL[r]}
                  </Text>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: full ? p.warnText : p.ink2 }}>
                    {u.active} / {premium ? '∞' : u.limit}
                  </Text>
                </View>
                {!premium && (
                  <View style={[styles.track, { backgroundColor: p.track }]}>
                    <View
                      style={{
                        width: `${pct * 100}%`,
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: full ? p.warn : p.accent,
                      }}
                    />
                  </View>
                )}
              </Card>
            );
          })}
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
  planBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  upgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  section: { fontSize: 10.5, letterSpacing: 1.4, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  track: { height: 7, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
});
