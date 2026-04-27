import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { clearAccessToken, setAccessToken } from '../api/axios';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'STAFF';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; data?: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      // Intentionally request ME using standard axios pipeline (which now properly triggers 401 retry-queue intercepts)
      const res = await api.get('/auth/me');
      setUser(res.data);
      // Backend should ideally respond with a token here or via the interceptor loop
    } catch (err: any) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn("Logout request failed or server already purged");
    } finally {
      clearAccessToken();
      setUser(null);
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  console.log("[DEBUG] AuthContext.tsx: AuthProvider rendering, user:", user, "isLoading:", isLoading);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
