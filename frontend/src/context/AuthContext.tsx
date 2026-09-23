import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as api from '../services/api';
import type { User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    age: number;
    gender: string;
    faculty: string;
    year_of_study: number;
    nickname?: string;
    privacy_consent: boolean;
  }) => Promise<string | undefined>;
  guestLogin: (nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = api.getStoredAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      api.clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (data: Parameters<AuthContextValue['register']>[0]) => {
      const res = await api.register(data);
      setUser(res.user);
      return res.message;
    },
    []
  );

  const guestLogin = useCallback(async (nickname?: string) => {
    const res = await api.guestLogin(nickname);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      guestLogin,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, guestLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
