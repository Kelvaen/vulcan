import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, PrimaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getCurrentCoords } from '../../lib/location';
import {
  assignWorkerToSite,
  createSite,
  getActiveUsers,
  getSites,
  getSiteWorkers,
  type ActiveUser,
  type Site,
} from '../../lib/api';

export default function Sites() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [rosters, setRosters] = useState<Record<number, number[]>>({}); // siteId -> workerIds
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  // create-site form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('150');

  // assignment
  const [pickUser, setPickUser] = useState<ActiveUser | null>(null);
  const [pickSite, setPickSite] = useState<Site | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [s, u] = await Promise.all([
        getSites(session.token),
        getActiveUsers(session.token, session.companyId),
      ]);
      setSites(s);
      setUsers(u.filter((x) => x.role === 'WORKER' || x.role === 'SUPERVISOR'));
      const map: Record<number, number[]> = {};
      await Promise.all(
        s.map(async (site) => {
          try {
            const roster = await getSiteWorkers(session.token, site.id);
            map[site.id] = [...new Set(roster.map((r) => r.workerId))];
          } catch {
            map[site.id] = [];
          }
        }),
      );
      setRosters(map);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not load sites', tone: 'error' });
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function useMyLocation() {
    setNotice({ text: '', tone: 'good' });
    const coords = await getCurrentCoords();
    if (!coords) {
      setNotice({
        text: 'Could not read your location. Turn on location access and try again.',
        tone: 'warn',
      });
      return;
    }
    setLat(coords.lat.toFixed(6));
    setLng(coords.lng.toFixed(6));
    setNotice({ text: 'Pinned this site to your current location.', tone: 'good' });
  }

  async function submitSite() {
    if (!session) return;
    if (!name || !location) {
      setNotice({ text: 'Name and location are required', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await createSite(session.token, {
        name,
        location,
        gpsLat: Number(lat) || 0,
        gpsLng: Number(lng) || 0,
        radiusMeters: Number(radius) || 150,
      });
      const ok = msg.toLowerCase().includes('success');
      setNotice({ text: msg, tone: ok ? 'good' : 'error' });
      if (ok) {
        setName(''); setLocation(''); setLat(''); setLng(''); setRadius('150');
        setShowForm(false);
        await load();
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Could not create site', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function assign() {
    if (!session || !pickUser || !pickSite) {
      setNotice({ text: 'Pick a person and a site first', tone: 'warn' });
      return;
    }
    setBusy(true);
    try {
      const msg = await assignWorkerToSite(session.token, pickUser.id, pickSite.id);
      const ok = msg.toLowerCase().includes('success');
      setNotice({
        text: ok ? `${pickUser.fullName} assigned to ${pickSite.name}` : msg,
        tone: ok ? 'good' : 'error',
      });
      if (ok) {
        setPickUser(null);
        setPickSite(null);
        await load();
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Assignment failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const nameOf = (id: number) => users.find((u) => u.id === id)?.fullName ?? `#${id}`;
  const input = [styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Sites & Assignments</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>
        Create sites and assign supervisors and workers to them
      </Text>

      <Notice text={notice.text} tone={notice.tone} />

      {/* Assign a person */}
      <SectionLabel>Assign someone to a site</SectionLabel>
      <Card>
        <Text style={[styles.miniLabel, { color: p.ink3 }]}>PERSON</Text>
        <View style={styles.wrap}>
          {users.length === 0 && (
            <Text style={{ fontSize: 12, color: p.ink3 }}>No workers or supervisors yet.</Text>
          )}
          {users.map((u) => (
            <Pressable
              key={u.id}
              onPress={() => setPickUser(u)}
              style={[
                styles.chip,
                { borderColor: p.line, backgroundColor: pickUser?.id === u.id ? p.accent : p.card2 },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: pickUser?.id === u.id ? '#fff' : p.ink2 }}>
                {u.fullName} · {u.role === 'SUPERVISOR' ? 'Sup' : 'Wkr'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 12 }]}>SITE</Text>
        <View style={styles.wrap}>
          {sites.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setPickSite(s)}
              style={[
                styles.chip,
                { borderColor: p.line, backgroundColor: pickSite?.id === s.id ? p.accent : p.card2 },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: pickSite?.id === s.id ? '#fff' : p.ink2 }}>
                {s.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton title="Assign" onPress={assign} loading={busy} style={{ marginTop: 14 }} />
      </Card>

      {/* Sites list */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
        <SectionLabel>{sites.length} site{sites.length === 1 ? '' : 's'}</SectionLabel>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setShowForm((v) => !v)} style={{ paddingVertical: 8 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: p.accent }}>
            {showForm ? 'Cancel' : '+ New site'}
          </Text>
        </Pressable>
      </View>

      {showForm && (
        <Card style={{ marginBottom: 10 }}>
          <Text style={[styles.miniLabel, { color: p.ink3 }]}>SITE NAME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Obuasi Site A" placeholderTextColor={p.ink3} style={input} />
          <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>LOCATION</Text>
          <TextInput value={location} onChangeText={setLocation} placeholder="Obuasi, Ashanti" placeholderTextColor={p.ink3} style={input} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>GPS LAT</Text>
              <TextInput value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="6.2027" placeholderTextColor={p.ink3} style={input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>GPS LNG</Text>
              <TextInput value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="-1.6631" placeholderTextColor={p.ink3} style={input} />
            </View>
            <View style={{ width: 90 }}>
              <Text style={[styles.miniLabel, { color: p.ink3, marginTop: 10 }]}>RADIUS m</Text>
              <TextInput value={radius} onChangeText={setRadius} keyboardType="number-pad" placeholderTextColor={p.ink3} style={input} />
            </View>
          </View>
          <Pressable
            onPress={useMyLocation}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' }}
          >
            <Ionicons name="navigate" size={14} color={p.accent} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: p.accent }}>Use my current location</Text>
          </Pressable>
          <PrimaryButton title="Create Site" onPress={submitSite} loading={busy} style={{ marginTop: 14 }} />
        </Card>
      )}

      {sites.map((s) => {
        const roster = rosters[s.id] ?? [];
        return (
          <Card key={s.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location" size={16} color={p.accent} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: p.ink, flex: 1 }}>{s.name}</Text>
              <Text style={{ fontSize: 11, color: p.ink3 }}>
                {roster.length} assigned
              </Text>
            </View>
            <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 2 }}>{s.location}</Text>
            {roster.length > 0 && (
              <View style={[styles.wrap, { marginTop: 10 }]}>
                {roster.map((id) => (
                  <View key={id} style={[styles.tag, { backgroundColor: p.track }]}>
                    <Text style={{ fontSize: 11, color: p.ink2 }}>{nameOf(id)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  miniLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  tag: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9 },
});
