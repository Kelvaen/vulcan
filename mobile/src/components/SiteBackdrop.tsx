import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/theme';

/**
 * Faint construction-site skyline pinned to the bottom of a screen.
 * A single white-on-transparent asset tinted with the theme's ink color,
 * so it adapts to light and dark mode without touching the palette.
 */
export default function SiteBackdrop({ opacity = 0.07, height = 200 }: { opacity?: number; height?: number }) {
  const { p } = useTheme();
  return (
    <Image
      source={require('../../assets/images/construction-bg.png')}
      style={[styles.img, { tintColor: p.ink, opacity, height }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  img: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    pointerEvents: 'none',
  },
});
