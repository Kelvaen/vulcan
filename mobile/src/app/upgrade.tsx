import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui';
import { useTheme } from '../context/theme';

// Placeholder — the Paystack premium checkout is wired up in the next phase.
export default function Upgrade() {
  const { p } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.screen }}
      contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: p.ink }}>Upgrade to Premium</Text>
          <Text style={{ fontSize: 12, color: p.ink3, marginTop: 2 }}>More seats for your growing team</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.close, { borderColor: p.line, backgroundColor: p.card }]}
        >
          <Ionicons name="close" size={18} color={p.ink2} />
        </Pressable>
      </View>

      <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
        <Ionicons name="rocket-outline" size={30} color={p.accent} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: p.ink, marginTop: 12 }}>
          Paystack checkout coming next
        </Text>
        <Text style={{ fontSize: 12.5, color: p.ink3, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
          {"Premium lifts the seat limits for workers, supervisors and admins.\nIn-app payment is being wired up."}
        </Text>
      </Card>
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
});
