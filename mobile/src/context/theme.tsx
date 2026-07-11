import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { palettes, type Palette, type ThemeMode } from '../lib/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  p: Palette;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  p: palettes.dark,
  toggle: () => {},
});

const STORAGE_KEY = 'vulcan-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setMode(saved);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      mode,
      p: palettes[mode],
      toggle: () => {
        setMode((m) => {
          const next = m === 'dark' ? 'light' : 'dark';
          AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
          return next;
        });
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
