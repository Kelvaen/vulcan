import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Notice, PrimaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { getSurveysByStatus, submitSurvey, verifySurvey, type Survey } from '../../lib/api';

const DEMO_SITE_ID = 1;

type Mode = 'submit' | 'review';

export default function Report() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('submit');
  const [checks, setChecks] = useState([
    { id: 1, label: 'Formwork — Block C complete', done: true },
    { id: 2, label: 'Concrete pour — 60 of 80 m³', done: false },
    { id: 3, label: 'Rebar inspection passed', done: true },
  ]);
  const [text, setText] = useState(
    'Pour delayed 40 min — waiting on Mixer M400. Need one more vibrator for the east wall.',
  );
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });
  const [busy, setBusy] = useState(false);

  // review state
  const [queue, setQueue] = useState<Survey[]>([]);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    if (!session || mode !== 'review') return;
    setQueueLoaded(false);
    getSurveysByStatus(session.token, 'SUBMITTED')
      .then(setQueue)
      .catch((e) => setNotice({ text: e?.message ?? 'Could not load reports', tone: 'error' }))
      .finally(() => setQueueLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, session?.token]);

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
        photoUrl: 'local://pending-upload',
      });
      setNotice({ text: msg, tone: msg.toLowerCase().includes('success') ? 'good' : 'warn' });
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Site Reports</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 14 }}>
        Obuasi Site A · daily reports and spot-check verification
      </Text>

      <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
        {(
          [
            ['submit', 'Submit Report'],
            ['review', 'Review Queue'],
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
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: mode === m ? '#fff' : p.ink3 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'submit' ? (
        <>
          <SectionLabel>Photo evidence</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {['06:58', '10:22'].map((t) => (
              <View key={t} style={[styles.photo, { backgroundColor: p.card2 }]}>
                <Ionicons name="image-outline" size={26} color={p.ink3} />
                <View style={styles.photoTime}>
                  <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '700' }}>{t}</Text>
                </View>
              </View>
            ))}
            <Pressable style={[styles.photo, styles.photoAdd, { borderColor: p.line }]}>
              <Ionicons name="add" size={20} color={p.ink3} />
              <Text style={{ fontSize: 10.5, color: p.ink3, marginTop: 4 }}>Add photo</Text>
            </Pressable>
          </View>

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

          <PrimaryButton title="Send to Supervisor" onPress={send} loading={busy} style={{ marginTop: 14 }} />
          <Notice text={notice.text} tone={notice.tone} />

          <View style={styles.warnNote}>
            <Ionicons name="warning-outline" size={15} color={p.warnText} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 11, color: p.ink3, lineHeight: 17 }}>
              Supervisors spot-check sites against these reports. A mismatch between report and
              ground truth is penalised.
            </Text>
          </View>
        </>
      ) : (
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
              <Text style={{ fontSize: 12.5, color: p.ink2, lineHeight: 19, marginTop: 8 }}>
                {s.reportText}
              </Text>
              <View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>
                <Pressable
                  disabled={actingId === s.id}
                  onPress={() => judge(s, 'VERIFIED')}
                  style={[styles.judge, { backgroundColor: 'rgba(12,163,12,0.13)' }]}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.goodText }}>Verify ✓</Text>
                </Pressable>
                <Pressable
                  disabled={actingId === s.id}
                  onPress={() => judge(s, 'MISMATCH')}
                  style={[styles.judge, { backgroundColor: 'rgba(250,178,25,0.13)' }]}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.warnText }}>Mismatch</Text>
                </Pressable>
                <Pressable
                  disabled={actingId === s.id}
                  onPress={() => judge(s, 'PENALIZED')}
                  style={[styles.judge, { backgroundColor: 'rgba(208,59,59,0.13)' }]}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.criticalText }}>Penalise</Text>
                </Pressable>
              </View>
            </Card>
          ))}
          <Notice text={notice.text} tone={notice.tone} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4, marginBottom: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  photo: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed' },
  photoTime: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
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
  warnNote: { flexDirection: 'row', gap: 9, marginTop: 12, paddingHorizontal: 4 },
});
