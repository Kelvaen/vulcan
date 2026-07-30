import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, sessionFromToken, type AuthResult, type Role, type Session } from '../lib/api';

interface AuthContextValue {
  session: Session | null;
  hydrated: boolean;
  displayName: string;
  initials: string;
  /** Step 1: validate the password. On success a login code is emailed (status OTP_SENT). */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Step 2: finish login once the emailed code is verified and a token is issued. */
  completeLogin: (token: string, email: string) => Session;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  hydrated: false,
  displayName: '',
  initials: '',
  signIn: async () => {
    throw new Error('not ready');
  },
  completeLogin: () => {
    throw new Error('not ready');
  },
  signOut: () => {},
});

const STORAGE_KEY = 'vulcan-session';

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSession(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const displayName = session ? (session.fullName ?? nameFromEmail(session.email)) : '';
    const initials =
      displayName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '·';
    return {
      session,
      hydrated,
      displayName,
      initials,
      signIn: async (email, password) => {
        return apiLogin(email.trim(), password);
      },
      completeLogin: (token, email) => {
        const s = sessionFromToken(token, email.trim());
        setSession(s);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
        return s;
      },
      signOut: () => {
        setSession(null);
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      },
    };
  }, [session, hydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function landingFor(role: Role): '/dashboard' | '/' {
  return role === 'MANAGER' || role === 'ADMIN' ? '/dashboard' : '/';
}
