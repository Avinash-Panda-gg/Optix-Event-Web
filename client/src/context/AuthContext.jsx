import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aq_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const saveAuth = (token, sessionToken, userData) => {
    localStorage.setItem('aq_token', token);
    localStorage.setItem('aq_session', sessionToken);
    localStorage.setItem('aq_user', JSON.stringify(userData));
    setUser(userData);
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem('aq_token');
    localStorage.removeItem('aq_session');
    localStorage.removeItem('aq_user');
    setUser(null);
    setTimeRemaining(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('aq_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await getMe();
      setUser(res.data.user);
      localStorage.setItem('aq_user', JSON.stringify(res.data.user));
      if (res.data.timeRemaining !== null) {
        setTimeRemaining(res.data.timeRemaining);
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'SESSION_REVOKED' || err.response?.status === 401) {
        clearAuth();
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{
      user, setUser, saveAuth, clearAuth, loading,
      timeRemaining, setTimeRemaining, refreshUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
