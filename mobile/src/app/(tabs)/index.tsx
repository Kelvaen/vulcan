import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SiteBackdrop from '../../components/SiteBackdrop';
import { Card, Notice, PrimaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getCurrentCoords } from '../../lib/location';
import {
  clockIn,
  clockOut,
  getWorkerSite,
  getWorkerTasksToday,
  updateTaskStatus,
  type Site,
  type WorkerTask,
} from '../../lib/api';

function useClock(): Date {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Home() {
  const { p } = useTheme();
  const { session, displayName, initials } = useAuth();
  const router = useRouter();
  const now = useClock();
  const [onShift, setOnShift] = useState(false);
  const [since, setSince] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [site, setSite] = useState<Site | null>(null);
  const [siteLoaded, setSiteLoaded] = useState(false);

  // Only field staff clock in; admins/managers are oversight and have no site.
  const isFieldStaff = session?.role === 'WORKER' || session?.role === 'SUPERVISOR';
  const workerId = session?.userId ?? null;

  useEffect(() => {
    if (!session || !isFieldStaff || workerId == null) {
      setSiteLoaded(true);
      setTasksLoaded(true);
      return;
    }
    getWorkerSite(session.token, workerId)
      .then(setSite)
      .catch(() => {})
      .finally(() => setSiteLoaded(true));
    getWorkerTasksToday(session.token, workerId)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setTasksLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  async function toggleTask(t: WorkerTask) {
    if (!session) return;
    const next: WorkerTask['status'] = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    try {
      await updateTaskStatus(session.token, t.id, next);
    } catch {
      // revert on failure so the UI never lies about saved state
      setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, status: t.status } : x)));
    }
  }

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const greeting = now.getHours() < 12 ? 'Morning,' : now.getHours() < 17 ? 'Afternoon,' : 'Evening,';

  // Home is only for field staff. Admins/managers who land on "/" go to their dashboard.
  if (session && !isFieldStaff) return <Redirect href="/dashboard" />;

  async function handleClock() {
    if (!session || workerId == null || !site) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      if (!onShift) {
        const coords = await getCurrentCoords();
        if (!coords) {
          setNotice({
            text: 'Location is needed to clock in. Turn on location access and try again.',
            tone: 'error',
          });
          return;
        }
        const msg = await clockIn(session.token, {
          workerId,
          siteId: site.id,
          gpsLat: coords.lat,
          gpsLng: coords.lng,
        });
        const ok = msg.toLowerCase().includes('success');
        const already = msg.toLowerCase().includes('already');
        if (ok || already) {
          setOnShift(true);
          setSince(`${hh}:${mm}`);
        }
        setNotice({ text: msg, tone: ok ? 'good' : already ? 'warn' : 'error' });
      } else {
        const msg = await clockOut(session.token, { workerId, siteId: site.id });
        const ok = msg.toLowerCase().includes('success');
        if (ok || msg.toLowerCase().includes('already')) setOnShift(false);
        setNotice({ text: msg, tone: ok ? 'good' : 'warn' });
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Network error — request queued for sync', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.screen }}>
      <SiteBackdrop opacity={0.05} height={170} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
      >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/profile')}
          style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: p.ink2 }}>{initials}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: p.ink3 }}>{greeting}</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: p.ink }}>{displayName}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={[styles.bell, { backgroundColor: p.card, borderColor: p.line }]}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={p.ink2} />
          {tasks.some((t) => t.status !== 'COMPLETED') && (
            <View style={[styles.bellDot, { backgroundColor: p.accent }]} />
          )}
        </Pressable>
      </View>

      {!isFieldStaff && (
        <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="shield-outline" size={22} color={p.ink2} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: p.ink }}>Oversight account</Text>
            <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 2 }}>
              {session?.role === 'ADMIN'
                ? 'Admins manage sites, approvals and equipment — no shift clock-in.'
                : 'Managers monitor operations from the dashboard — no shift clock-in.'}
            </Text>
          </View>
        </Card>
      )}

      {isFieldStaff && (
        <>
          <View style={[styles.siteChip, { backgroundColor: p.card, borderColor: p.line }]}>
            <Ionicons name="location-outline" size={13} color={site ? p.accent : p.ink3} />
            <Text style={{ fontSize: 12, color: p.ink2 }}>
              {site ? `${site.name} · ${site.location}` : siteLoaded ? 'Not assigned to a site' : 'Loading site…'}
            </Text>
          </View>

          <Card
            style={[
              { alignItems: 'center', paddingVertical: 22, borderRadius: 20, backgroundColor: p.card2 },
              onShift && { borderColor: 'rgba(12,163,12,0.5)' },
            ]}
          >
            <Text style={{ fontSize: 11, letterSpacing: 1.8, color: p.ink3, fontWeight: '700' }}>
              CURRENT SHIFT
            </Text>
            <Text style={[styles.time, { color: p.ink }]}>
              {hh}:{mm}:{ss}
            </Text>
            <Text style={{ fontSize: 12, color: p.ink3, marginBottom: 14 }}>
              {now.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <View
              style={[
                styles.pill,
                { backgroundColor: onShift ? 'rgba(12,163,12,0.12)' : p.track },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: onShift ? p.good : p.ink3 }]} />
              <Text style={{ fontSize: 11.5, fontWeight: '600', color: onShift ? p.goodText : p.ink2 }}>
                {onShift ? `On site · since ${since}` : 'Off shift'}
              </Text>
            </View>
            {onShift && (
              <View style={styles.gpsRow}>
                <Ionicons name="checkmark" size={13} color={p.goodText} />
                <Text style={{ fontSize: 11.5, color: p.goodText }}>
                  GPS verified — inside site geofence
                </Text>
              </View>
            )}
            {site ? (
              <PrimaryButton
                title={onShift ? 'Clock Out' : 'Clock In'}
                variant={onShift ? 'ghost' : 'solid'}
                onPress={handleClock}
                loading={busy}
                style={{ alignSelf: 'stretch', marginTop: 16 }}
              />
            ) : (
              siteLoaded && (
                <Text
                  style={{
                    fontSize: 12,
                    color: p.warnText,
                    textAlign: 'center',
                    marginTop: 16,
                    lineHeight: 18,
                  }}
                >
                  {"You're not assigned to a site yet.\nAsk your admin to assign you before clocking in."}
                </Text>
              )
            )}
            <Notice text={notice.text} tone={notice.tone} />
          </Card>

          <SectionLabel>{`Today's tasks · ${tasks.length}`}</SectionLabel>
          {tasksLoaded && tasks.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Ionicons name="cafe-outline" size={22} color={p.ink3} />
          <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8 }}>
            No tasks assigned for today yet
          </Text>
        </Card>
      )}
      {tasks.map((t) => {
        const done = t.status === 'COMPLETED';
        return (
          <Pressable key={t.id} onPress={() => toggleTask(t)}>
            <Card style={[styles.task, { marginBottom: 8 }]}>
              <View
                style={[
                  styles.tick,
                  { borderColor: p.ink3 },
                  done && { backgroundColor: p.good, borderColor: p.good },
                ]}
              >
                {done && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: '600',
                    color: done ? p.ink3 : p.ink,
                    textDecorationLine: done ? 'line-through' : 'none',
                  }}
                >
                  {t.description}
                </Text>
                <Text style={{ fontSize: 11, color: p.ink3, marginTop: 2 }}>
                  {t.assignedBy ? `Assigned by supervisor #${t.assignedBy}` : 'Assigned'} ·{' '}
                  {t.status.replace('_', ' ').toLowerCase()}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}

          <SectionLabel>This period</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card style={{ flex: 1 }}>
              <Text style={{ fontSize: 21, fontWeight: '800', color: p.ink }}>18 days</Text>
              <Text style={[styles.statLabel, { color: p.ink3 }]}>ATTENDANCE STREAK</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={{ fontSize: 21, fontWeight: '800', color: p.ink }}>42.5 h</Text>
              <Text style={[styles.statLabel, { color: p.ink3 }]}>HOURS THIS WEEK</Text>
            </Card>
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4 },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  time: { fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'], marginVertical: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginTop: 3 },
});
