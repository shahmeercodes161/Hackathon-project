import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, setupService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const [companyName, setCompanyName] = useState('HCM Lite');

  const checkSetupStatus = useCallback(async () => {
    try {
      const res = await setupService.getStatus();
      if (res.success) {
        setIsSetupComplete(res.isSetupComplete);
        if (res.companyName) setCompanyName(res.companyName);
      }
    } catch (err) {
      console.warn('Setup status check note:', err.message);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return null;
    try {
      const res = await authService.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Initialize: verify setup status & token
  useEffect(() => {
    const initAuth = async () => {
      await checkSetupStatus();
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(savedToken);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [checkSetupStatus]);

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authService.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Direct set session (used after initial onboarding setup)
  const setSession = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setIsSetupComplete(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isSetupComplete,
        companyName,
        loading,
        error,
        login,
        logout,
        setSession,
        refreshUser,
        checkSetupStatus,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
