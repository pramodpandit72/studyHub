import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/auth.api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('studyhub_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('studyhub_token'));
  });

  const [loading, setLoading] = useState(() => {
    return Boolean(localStorage.getItem('studyhub_token'));
  });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('studyhub_token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      const currentUser = data?.data?.user;
      setUser(currentUser);
      setIsAuthenticated(true);
      if (currentUser) {
        localStorage.setItem('studyhub_user', JSON.stringify(currentUser));
      }
    } catch {
      localStorage.removeItem('studyhub_token');
      localStorage.removeItem('studyhub_user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback((token, userData) => {
    disconnectSocket();
    localStorage.setItem('studyhub_token', token);
    if (userData) {
      localStorage.setItem('studyhub_user', JSON.stringify(userData));
    }
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    disconnectSocket();
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_user');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      try {
        localStorage.setItem('studyhub_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
