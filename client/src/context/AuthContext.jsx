import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('natanz_token');
    const savedUser = localStorage.getItem('natanz_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('natanz_token');
        localStorage.removeItem('natanz_user');
      }
    }
    setLoading(false);
  }, []);

  async function login(login, password) {
    const res = await api.post('/auth/login', { login, password });
    const { token, user } = res.data.data;
    localStorage.setItem('natanz_token', token);
    localStorage.setItem('natanz_user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(username, email, password, full_name) {
    const res = await api.post('/auth/register', { username, email, password, full_name });
    const { token, user } = res.data.data;
    localStorage.setItem('natanz_token', token);
    localStorage.setItem('natanz_user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('natanz_token');
    localStorage.removeItem('natanz_user');
    setUser(null);
  }

  function updateUser(userData) {
    localStorage.setItem('natanz_user', JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
