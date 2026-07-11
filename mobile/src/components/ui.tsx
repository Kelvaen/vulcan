import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { p } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: p.card, borderColor: p.line, borderWidth: 1, borderRadius: 16, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { p } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: p.ink3,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 10,
        marginHorizontal: 2,
      }}
    >
      {children}
    </Text>
  );
}

export function StatusChip({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ fontSize: 10.5, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { p } = useTheme();
  const base: ViewStyle =
    variant === 'solid'
      ? { backgroundColor: p.accent }
      : variant === 'danger'
        ? { backgroundColor: p.accentSoft, borderWidth: 1.5, borderColor: 'rgba(233,69,96,0.4)' }
        : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: p.line };
  const color = variant === 'solid' ? '#fff' : variant === 'danger' ? p.accent : p.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        base,
        pressed && { transform: [{ scale: 0.98 }] },
        loading && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[{ color, fontSize: 15, fontWeight: '700' }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Notice({ text, tone }: { text: string; tone: 'good' | 'warn' | 'error' }) {
  const { p } = useTheme();
  const color = tone === 'good' ? p.goodText : tone === 'warn' ? p.warnText : p.accent;
  if (!text) return null;
  return (
    <Text style={{ color, fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 10 }}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
