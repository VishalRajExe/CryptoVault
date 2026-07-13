import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getProfile } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(() => localStorage.getItem('cv_jwt'));
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('cv_jwt');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem('cv_jwt');
      setJwt(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cv_jwt');
    setJwt(null);
    setUser(null);
  }, []);

  useEffect(() => {
    loadProfile();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [loadProfile, logout]);

  const login = useCallback(
    async (token) => {
      localStorage.setItem('cv_jwt', token);
      setJwt(token);
      setLoading(true);
      await loadProfile();
    },
    [loadProfile]
  );


  return (
    <AuthContext.Provider value={{ user, jwt, loading, login, logout, refresh: loadProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
