import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ role: 'visitor', loading: true });

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setSession({ ...me, loading: false });
    } catch {
      setSession({ role: 'visitor', loading: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    await api.login(email, password);
    await refresh();
  };

  const logout = async () => {
    await api.logout();
    await refresh();
  };

  const isAdmin = session.role === 'admin';

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading: session.loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
