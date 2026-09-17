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

      // Attach token to axios headers before calling /auth/me
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const res = await axios.post('https://hashnodedev.onrender.com/api/auth/login', {
  email: cleanEmail,
  password: cleanPassword,
});
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

  // 2. Login function: stores the raw string token and sets header
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await api.post('/auth/login', { email: cleanEmail, password });
    
    // In auth_routes.py, UserResponse returns token inside res.data.token
    const { token, ...userData } = res.data;

    if (token) {
      localStorage.setItem('token', token);
      // Immediately set the header on axios so next requests succeed
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