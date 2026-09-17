import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Restore user on app mount if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Attach token to axios instance headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        // Call your session/profile endpoint, not login
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 2. Login function
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await api.post('/auth/login', { email: cleanEmail, password });
    
    const { token, ...userData } = res.data;

    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(userData);
    return res.data;
  };

  // 3. Register function
  const register = async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await api.post('/auth/register', { name: name.trim(), email: cleanEmail, password });
    const { token, ...userData } = res.data;

    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(userData);
    return res.data;
  };

  // 4. Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}