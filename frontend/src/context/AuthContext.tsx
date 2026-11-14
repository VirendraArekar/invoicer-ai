import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('invoicer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('invoicer_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.me();
          setUser(profile);
          localStorage.setItem('invoicer_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const handleAuthSuccess = (res: { user: User; accessToken: string }) => {
    setUser(res.user);
    setToken(res.accessToken);
    localStorage.setItem('invoicer_user', JSON.stringify(res.user));
    localStorage.setItem('invoicer_token', res.accessToken);
  };

  const login = async (data: any) => {
    const res = await authApi.login(data);
    handleAuthSuccess(res);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    handleAuthSuccess(res);
  };

  const demoLogin = async () => {
    const res = await authApi.demoLogin();
    handleAuthSuccess(res);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('invoicer_user');
    localStorage.removeItem('invoicer_token');
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updated };
      setUser(merged);
      localStorage.setItem('invoicer_user', JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
