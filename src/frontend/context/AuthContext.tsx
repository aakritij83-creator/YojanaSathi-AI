import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { LanguageCode, NotificationPreferences, UserProfile, UserRole } from '../../../backend/types/index.ts';
import { apiRequest, setStoredToken } from '../services/api.ts';
import { useLanguage } from './LanguageContext.tsx';
import { useTheme } from './ThemeContext.tsx';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  preferredLanguage: LanguageCode;
  themePreference: 'light' | 'dark';
  profile: UserProfile;
  notificationPreferences: NotificationPreferences;
  recentlyViewedSchemeIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    preferredLanguage: LanguageCode;
    acceptTerms: boolean;
  }) => Promise<PublicUser>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<PublicUser | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useLanguage();
  const { setTheme } = useTheme();

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ authenticated: boolean; user: PublicUser | null }>('/api/auth/session');
      if (data.authenticated && data.user) {
        setUser(data.user);
        if (data.user.preferredLanguage) {
          setLanguage(data.user.preferredLanguage);
        }
        if (data.user.themePreference) {
          setTheme(data.user.themePreference);
        }
      } else {
        setUser(null);
        setStoredToken(null);
      }
    } catch {
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  }, [setLanguage, setTheme]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: PublicUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    if (data.user.preferredLanguage) setLanguage(data.user.preferredLanguage);
    if (data.user.themePreference) setTheme(data.user.themePreference);
    return data.user;
  };

  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    preferredLanguage: LanguageCode;
    acceptTerms: boolean;
  }) => {
    const data = await apiRequest<{ token: string; user: PublicUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    setUser(data.user);
    if (data.user.preferredLanguage) setLanguage(data.user.preferredLanguage);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network failures on logout
    }
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
