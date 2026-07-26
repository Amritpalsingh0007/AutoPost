import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, saveTokens, clearTokens } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Rehydrate user from localStorage on mount.
    // Tokens are already in localStorage under access_token / refresh_token —
    // the axios interceptor will pick them up automatically.
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted value — clear it so the user can log in fresh.
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, accessToken: string, refreshToken: string) => {
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    // Store both tokens — the interceptor reads access_token for every request
    // and refresh_token when it needs to silently renew.
    saveTokens(accessToken, refreshToken);
  };

  const logout = async () => {
    // Best-effort: revoke the refresh token server-side so it cannot be
    // replayed. If this fails (e.g. token already expired) we still clear
    // local state so the user is logged out on the client.
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // Intentionally swallowed — we log out locally regardless.
      }
    }
    setUser(null);
    localStorage.removeItem('auth_user');
    clearTokens();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
