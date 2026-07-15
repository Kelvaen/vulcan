import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, PrimaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  getAllSurveys,
  getSurveysByStatus,
  submitSurvey,
  verifySurvey,
  type Survey,
} from '../../lib/api';
import { pickImageDataUri } from '../../lib/photo';

const DEMO_SITE_ID = 1;

type Mode = 'submit' | 'review' | 'archive';

const STATUS_TONE: Record<Survey['status'], { label: string; key: 'good' | 'warn' | 'neutral' | 'critical' }> = {
  SUBMITTED: { label: 'Submitted', key: 'neutral' },
  VERIFIED: { label: 'Verified', key: 'good' },
  MISMATCH: { label: 'Mismatch', key: 'warn' },
  PENALIZED: { label: 'Penalised', key: 'critical' },
};

export default function Report() {
  const { p } = useTheme();
  const { session } = useAuth();
  const isAdmin = session?.role === 'ADMIN';
  const [mode, setMode] = useState<Mode>(isAdmin ? 'archive' : 'submit');

  const [checks, setChecks] = useState([
    { id: 1, label: 'Formwork — Block C complete', done: true },
    { id: 2, label: 'Concrete pour — 60 of 80 m³', done: false },
    { id: 3, label: 'Rebar inspection passed', done: true },
  ]);
  const [text, setText] = useState(
    'Pour delayed 40 min — waiting on Mixer M400. Need one more vibrator for the east wall.',
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });
  const [busy, setBusy] = useState(false);

  // review + archive lists
  const [queue, setQueue] = useState<Survey[]>([]);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [archive, setArchive] = useState<Survey[]>([]);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (mode === 'review') {
      setQueueLoaded(false);
      getSurveysByStatus(session.token, 'SUBMITTED')
        .then(setQueue)
        .catch((e) => setNotice({ text: e?.message ?? 'Could not load reports', tone: 'error' }))
        .finally(() => setQueueLoaded(true));
    } else if (mode === 'archive') {
      setArchiveLoaded(false);
      getAllSurveys(session.token)
        .then(setArchive)
        .catch((e) => setNotice({ text: e?.message ?? 'Could not load reports', tone: 'error' }))
        .finally(() => setArchiveLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, session?.token]);

  async function addPhoto() {
    const uri = await pickImageDataUri('camera');
    if (uri) setPhoto(uri);
  }

  async function send() {
    if (!session) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const done = checks.filter((c) => c.done).map((c) => c.label);
      const msg = await submitSurvey(session.token, {
        siteId: DEMO_SITE_ID,
        foremanId: session.userId ?? 2,
        reportText: `${text}\n\nCompleted: ${done.join('; ')}`,
        photoUrl: photo ?? 'local://no-photo',
      });
      const ok = msg.toLowerCase().includes('success');
      setNotice({ text: ok ? 'Report and photo sent to admin' : msg, tone: ok ? 'good' : 'warn' });
      if (ok) setPhoto(null);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Network error', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function judge(s: Survey, status: 'VERIFIED' | 'MISMATCH' | 'PENALIZED') {
    if (!session) return;
    setActingId(s.id);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg = await verifySurvey(session.token, s.id, {
        verifiedBy: session.userId ?? 0,
        status,
        verificationNotes: `Spot-check by ${session.fullName ?? session.email} via mobile app`,
      });
      setQueue((list) => list.filter((x) => x.id !== s.id));
      setNotice({
        text: `Report #${s.id}: ${msg}`,
        tone: status === 'VERIFIED' ? 'good' : status === 'MISMATCH' ? 'warn' : 'error',
      });
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Action failed', tone: 'error' });
    } finally {
      setActingId(null);
    }
  }

  function statusChip(key: string): { color: string; bg: string } {
    switch (key) {
      case 'good': return { color: p.goodText, bg: 'rgba(12,163,12,0.13)' };
      case 'warn': return { color: p.warnText, bg: 'rgba(250,178,25,0.13)' };
      case 'critical': return { color: p.criticalText, bg: 'rgba(208,59,59,0.13)' };
      default: return { color: p.ink2, bg: p.track };
    }
  }

  const modes: [Mode, string][] = isAdmin
    ? [['archive', 'All Reports']]
    : [
        ['submit', 'Submit Report'],
        ['review', 'Review Queue'],
      ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Site Reports</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 14 }}>
        {isAdmin ? 'Daily reports and photo evidence from every site' : 'Obuasi Site A · daily reports and spot-check verification'}
      </Text>

      {modes.length > 1 && (
        <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
          {modes.map(([m, label]) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                setNotice({ text: '', tone: 'good' });
              }}
              style={[styles.segBtn, mode === m && { backgroundColor: p.accent }]}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: mode === m ? '#fff' : p.ink3 }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {mode === 'submit' && (
        <>
          <SectionLabel>Photo evidence</SectionLabel>
          {photo ? (
            <View>
              <Image source={{ uri: photo }} style={styles.evidence} resizeMode="cover" />
              <Pressable
                onPress={addPhoto}
                style={[styles.retake, { backgroundColor: p.card, borderColor: p.line }]}
              >
                <Ionicons name="camera-outline" size={13} color={p.ink2} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: p.ink2 }}>Retake</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={addPhoto}
              style={[styles.photoAddWide, { borderColor: p.line, backgroundColor: p.card2 }]}
            >
              <Ionicons name="camera-outline" size={26} color={p.ink3} />
              <Text style={{ fontSize: 12, color: p.ink3, marginTop: 6 }}>
                {"Take a photo of the site's condition"}
              </Text>
            </Pressable>
          )}

          <SectionLabel>Task checklist</SectionLabel>
          {checks.map((c) => (
            <Pressable
              key={c.id}
              onPress={() =>
                setChecks((list) => list.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))
              }
            >
              <Card style={[styles.check, { marginBottom: 8 }]}>
                <View
                  style={[
                    styles.tick,
                    { borderColor: p.ink3 },
                    c.done && { backgroundColor: p.good, borderColor: p.good },
                  ]}
                >
                  {c.done && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '600',
                    color: c.done ? p.ink3 : p.ink,
                    textDecorationLine: c.done ? 'line-through' : 'none',
                  }}
                >
                  {c.label}
                </Text>
              </Card>
            </Pressable>
          ))}

          <SectionLabel>Notes</SectionLabel>
          <Card>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              style={{ color: p.ink, fontSize: 13, lineHeight: 20, minHeight: 70, textAlignVertical: 'top' }}
              placeholderTextColor={p.ink3}
              placeholder="What happened on site today?"
            />
          </Card>

          <PrimaryButton title="Send to Admin" onPress={send} loading={busy} style={{ marginTop: 14 }} />
          <Notice text={notice.text} tone={notice.tone} />

          <View style={styles.warnNote}>
            <Ionicons name="warning-outline" size={15} color={p.warnText} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 11, color: p.ink3, lineHeight: 17 }}>
              The admin saves these daily reports. Supervisors also spot-check sites against them — a
              mismatch between report and ground truth is penalised.
            </Text>
          </View>
        </>
      )}

      {mode === 'review' && (
        <>
          {queueLoaded && queue.length === 0 && (
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="checkmark-done-outline" size={24} color={p.good} />
              <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8 }}>
                No reports waiting for review
              </Text>
            </Card>
          )}
          {queue.map((s) => (
            <Card key={s.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text-outline" size={16} color={p.ink2} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: p.ink, flex: 1 }}>
                  Report #{s.id} · Foreman #{s.foremanId} · Site {s.siteId}
                </Text>
              </View>
              {s.photoUrl?.startsWith('data:') && (
                <Image source={{ uri: s.photoUrl }} style={styles.reportPhoto} resizeMode="cover" />
              )}
              <Text style={{ fontSize: 12.5, color: p.ink2, lineHeight: 19, marginTop: 8 }}>
                {s.reportText}
              </Text>
              <View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>
                <Pressable disabled={actingId === s.id} onPress={() => judge(s, 'VERIFIED')} style={[styles.judge, { backgroundColor: 'rgba(12,163,12,0.13)' }]}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.goodText }}>Verify ✓</Text>
                </Pressable>
                <Pressable disabled={actingId === s.id} onPress={() => judge(s, 'MISMATCH')} style={[styles.judge, { backgroundColor: 'rgba(250,178,25,0.13)' }]}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.warnText }}>Mismatch</Text>
                </Pressable>
                <Pressable disabled={actingId === s.id} onPress={() => judge(s, 'PENALIZED')} style={[styles.judge, { backgroundColor: 'rgba(208,59,59,0.13)' }]}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.criticalText }}>Penalise</Text>
                </Pressable>
              </View>
            </Card>
          ))}
          <Notice text={notice.text} tone={notice.tone} />
        </>
      )}

      {mode === 'archive' && (
        <>
          <Notice text={notice.text} tone={notice.tone} />
          {archiveLoaded && archive.length === 0 && (
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="folder-open-outline" size={24} color={p.ink3} />
              <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8 }}>No reports yet.</Text>
            </Card>
          )}
          {archive.map((s) => {
            const meta = STATUS_TONE[s.status];
            const c = statusChip(meta.key);
            return (
              <Card key={s.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="document-text-outline" size={16} color={p.ink2} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: p.ink, flex: 1 }}>
                    Report #{s.id} · Foreman #{s.foremanId} · Site {s.siteId}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: c.color }}>{meta.label}</Text>
                  </View>
                </View>
                {s.photoUrl?.startsWith('data:') ? (
                  <Image source={{ uri: s.photoUrl }} style={styles.reportPhoto} resizeMode="cover" />
                ) : (
                  <View style={[styles.noPhoto, { backgroundColor: p.card2 }]}>
                    <Ionicons name="image-outline" size={18} color={p.ink3} />
                    <Text style={{ fontSize: 10.5, color: p.ink3, marginTop: 3 }}>No photo attached</Text>
                  </View>
                )}
                <Text style={{ fontSize: 12.5, color: p.ink2, lineHeight: 19, marginTop: 8 }}>
                  {s.reportText}
                </Text>
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4, marginBottom: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  evidence: { width: '100%', height: 190, borderRadius: 14 },
  retake: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  photoAddWide: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportPhoto: { width: '100%', height: 170, borderRadius: 12, marginTop: 10 },
  noPhoto: {
    height: 60,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judge: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  badge: { borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  warnNote: { flexDirection: 'row', gap: 9, marginTop: 12, paddingHorizontal: 4 },
});
