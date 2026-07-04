import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      setUser(data);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const register = async (email, password, preferredLanguage) => {
    try {
      const data = await api.auth.register(email, password, preferredLanguage);
      setUser(data);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    setUser(null);
  };

  const setUserLevel = (newLevel) => {
    setUser(prev => prev ? { ...prev, currentLevel: newLevel, levelCorrectStreak: 0 } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout, setUserLevel }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
