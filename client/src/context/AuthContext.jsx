
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function initialUser() {
  try {
    return JSON.parse(localStorage.getItem('sneaker_user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sneaker_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sneaker_user');
    }
  }, [user]);

  const setSession = (token, sessionUser) => {
    if (token) localStorage.setItem('sneaker_token', token);
    if (sessionUser) setUser(sessionUser);
  };

  const login = async (credentials) => {
    const data = await api.login(credentials);
    setSession(data.token, data.user);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || '/api'}/auth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Google sign-in failed.');
    }

    setSession(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.register(payload);

    localStorage.setItem(
      'sneaker_pending_email',
      String(payload.email).trim().toLowerCase()
    );

    if (data.previewUrl) {
      localStorage.setItem('sneaker_pending_preview_url', data.previewUrl);
    } else {
      localStorage.removeItem('sneaker_pending_preview_url');
    }

    return data;
  };

  const completeVerification = (data) => {
    setSession(data.token, data.user);
    localStorage.removeItem('sneaker_pending_email');
    localStorage.removeItem('sneaker_pending_preview_url');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sneaker_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        setSession,
        login,
        loginWithGoogle,
        register,
        completeVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
