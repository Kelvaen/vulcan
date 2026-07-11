import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Notice, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { verifyGroupPhoto } from '../../lib/api';

const DEMO_SITE_ID = 1;

interface AiSummary {
  present: number;
  absent: number;
  raw: string;
}

export default function RollCall() {
  const { p } = useTheme();
  const { session } = useAuth();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<AiSummary | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'good' | 'warn' | 'error' }>({
    text: '',
    tone: 'good',
  });
  const [busy, setBusy] = useState(false);

  async function capture() {
    setNotice({ text: '', tone: 'good' });
    setResult(null);
    // Native: open the camera. Web (and simulators without cameras): pick a file.
    const useCamera = Platform.OS !== 'web';
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setNotice({ text: 'Camera permission is required for roll call', tone: 'warn' });
        return;
      }
    }
    const picked = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!picked.canceled && picked.assets?.[0]) {
      setPhoto(picked.assets[0]);
    }
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
      // Backend replies like: "Attendance updated from AI verification. Present: 3, Absent: 1"
      const m = msg.match(/Present:\s*(\d+).*Absent:\s*(\d+)/i);
      if (m) {
        setResult({ present: Number(m[1]), absent: Number(m[2]), raw: msg });
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Roll Call — Group Photo</Text>
      <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2, marginBottom: 16 }}>
        One photo verifies the whole crew · DeepFace Facenet
      </Text>

      <View style={[styles.viewfinder, !photo && { backgroundColor: '#1c1c3a' }]}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, textAlign: 'center' }}>
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
        onPress={capture}
        style={{ marginTop: 14 }}
      />
      {photo && (
        <PrimaryButton
          title="Verify Attendance"
          onPress={verify}
          loading={busy}
          style={{ marginTop: 8 }}
        />
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

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={15} color={p.ink3} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: p.ink3, lineHeight: 17 }}>
          Faces are matched against enrolled workers only — register each worker's face once via the
          AI service. Unmatched faces are flagged to the supervisor automatically.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewfinder: {
    aspectRatio: 4 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  kpiLabel: { fontSize: 9.5, letterSpacing: 1.2, fontWeight: '700', marginTop: 4 },
  hint: { flexDirection: 'row', gap: 9, marginTop: 16, paddingHorizontal: 4 },
});
