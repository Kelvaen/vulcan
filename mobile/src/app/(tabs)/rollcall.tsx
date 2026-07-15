import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Notice, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import {
  getActiveUsers,
  registerFace,
  verifyGroupPhoto,
  type ActiveUser,
} from '../../lib/api';

const DEMO_SITE_ID = 1;

type Mode = 'rollcall' | 'enroll';

interface AiSummary {
  present: number;
  absent: number;
}

async function pickPhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const useCamera = Platform.OS !== 'web';
  if (useCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  const picked = useCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
  return picked.canceled ? null : (picked.assets?.[0] ?? null);
}

export default function RollCall() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('rollcall');

  // roll call state
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<AiSummary | null>(null);

  // enrollment state
  const [workers, setWorkers] = useState<ActiveUser[]>([]);
  const [selected, setSelected] = useState<ActiveUser | null>(null);
  const [enrollPhoto, setEnrollPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });

  useEffect(() => {
    if (!session || mode !== 'enroll' || workers.length > 0) return;
    getActiveUsers(session.token, session.companyId)
      .then((users) => setWorkers(users.filter((u) => u.role === 'WORKER' || u.role === 'SUPERVISOR')))
      .catch((e) => setNotice({ text: e?.message ?? 'Could not load workers', tone: 'error' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, session?.token]);

  function switchMode(m: Mode) {
    setMode(m);
    setNotice({ text: '', tone: 'good' });
  }

  async function captureRollcall() {
    setNotice({ text: '', tone: 'good' });
    setResult(null);
    const a = await pickPhoto();
    if (a) setPhoto(a);
    else if (Platform.OS !== 'web')
      setNotice({ text: 'Camera permission is required for roll call', tone: 'warn' });
  }

  async function verify() {
    if (!session || !photo) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg = await verifyGroupPhoto(session.token, DEMO_SITE_ID, {
        uri: photo.uri,
        name: photo.fileName ?? 'group-photo.jpg',
        type: photo.mimeType ?? 'image/jpeg',
      });
      const m = msg.match(/Present:\s*(\d+).*Absent:\s*(\d+)/i);
      if (m) {
        setResult({ present: Number(m[1]), absent: Number(m[2]) });
        setNotice({ text: 'Attendance updated from the group photo', tone: 'good' });
      } else {
        setNotice({ text: msg, tone: msg.toLowerCase().includes('fail') ? 'error' : 'warn' });
      }
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Upload failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function captureEnroll() {
    setNotice({ text: '', tone: 'good' });
    const a = await pickPhoto();
    if (a) setEnrollPhoto(a);
  }

  async function enroll() {
    if (!selected || !enrollPhoto) return;
    setBusy(true);
    setNotice({ text: '', tone: 'good' });
    try {
      const msg = await registerFace(selected.id, {
        uri: enrollPhoto.uri,
        name: enrollPhoto.fileName ?? 'face.jpg',
        type: enrollPhoto.mimeType ?? 'image/jpeg',
      });
      const ok = msg.toLowerCase().includes('success');
      setNotice({ text: msg, tone: ok ? 'good' : 'error' });
      if (ok) setEnrollPhoto(null);
    } catch (e: any) {
      setNotice({ text: e?.message ?? 'Enrollment failed', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Roll Call</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 14 }}>
        DeepFace Facenet · one group photo verifies the whole crew
      </Text>

      <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
        {(
          [
            ['rollcall', 'Group Photo'],
            ['enroll', 'Enroll Face'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            style={[styles.segBtn, mode === m && { backgroundColor: p.accent }]}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: mode === m ? '#fff' : p.ink3 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'rollcall' ? (
        <>
          <View style={[styles.viewfinder, !photo && { backgroundColor: '#1c1c3a' }]}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5 }}>
                  {Platform.OS === 'web'
                    ? 'Choose a crew photo to verify'
                    : 'Take one group photo of the crew'}
                </Text>
              </View>
            )}
          </View>

          <PrimaryButton
            title={photo ? 'Retake Photo' : Platform.OS === 'web' ? 'Choose Photo' : 'Capture Group Photo'}
            variant={photo ? 'ghost' : 'solid'}
            onPress={captureRollcall}
            style={{ marginTop: 14 }}
          />
          {photo && (
            <PrimaryButton title="Verify Attendance" onPress={verify} loading={busy} style={{ marginTop: 8 }} />
          )}
          <Notice text={notice.text} tone={notice.tone} />

          {result && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Card style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: p.goodText }}>{result.present}</Text>
                <Text style={[styles.kpiLabel, { color: p.ink3 }]}>VERIFIED PRESENT</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: p.warnText }}>{result.absent}</Text>
                <Text style={[styles.kpiLabel, { color: p.ink3 }]}>MARKED ABSENT</Text>
              </Card>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={{ fontSize: 12, color: p.ink3, marginBottom: 10 }}>
            Pick a crew member, take one clear photo of their face, and register it. After that,
            group photos will recognise them automatically.
          </Text>

          {workers.map((w) => (
            <Pressable key={w.id} onPress={() => setSelected(w)}>
              <Card
                style={[
                  styles.workerRow,
                  selected?.id === w.id && { borderColor: p.accent, borderWidth: 1.5 },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: p.avatar, borderColor: p.line }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: p.ink2 }}>
                    {w.fullName
                      .split(' ')
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: p.ink }}>{w.fullName}</Text>
                  <Text style={{ fontSize: 11, color: p.ink3 }}>
                    #{w.id} · {w.role}
                  </Text>
                </View>
                {selected?.id === w.id && <Ionicons name="checkmark-circle" size={20} color={p.accent} />}
              </Card>
            </Pressable>
          ))}

          {selected && (
            <>
              <View style={[styles.viewfinder, { marginTop: 12 }, !enrollPhoto && { backgroundColor: '#1c1c3a' }]}>
                {enrollPhoto ? (
                  <Image source={{ uri: enrollPhoto.uri }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: 10 }}>
                    <Ionicons name="person-outline" size={36} color="rgba(255,255,255,0.5)" />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5 }}>
                      One clear face photo of {selected.fullName.split(' ')[0]}
                    </Text>
                  </View>
                )}
              </View>
              <PrimaryButton
                title={enrollPhoto ? 'Retake Photo' : Platform.OS === 'web' ? 'Choose Photo' : 'Take Face Photo'}
                variant={enrollPhoto ? 'ghost' : 'solid'}
                onPress={captureEnroll}
                style={{ marginTop: 12 }}
              />
              {enrollPhoto && (
                <PrimaryButton
                  title={`Register ${selected.fullName.split(' ')[0]}'s Face`}
                  onPress={enroll}
                  loading={busy}
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}
          <Notice text={notice.text} tone={notice.tone} />
        </>
      )}

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={15} color={p.ink3} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: p.ink3, lineHeight: 17 }}>
          Faces are matched against enrolled workers only. Unmatched faces in a group photo are
          flagged to the supervisor automatically.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4, marginBottom: 14 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  viewfinder: {
    aspectRatio: 4 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  kpiLabel: { fontSize: 9.5, letterSpacing: 1.2, fontWeight: '700', marginTop: 4 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8, paddingVertical: 11 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { flexDirection: 'row', gap: 9, marginTop: 16, paddingHorizontal: 4 },
});
