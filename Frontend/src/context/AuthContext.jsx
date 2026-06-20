import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const loginTime = localStorage.getItem('loginTime');

      if (token) {
        // Check local expiry (30 days)
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        if (loginTime && Date.now() - parseInt(loginTime) > THIRTY_DAYS) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTime');
          setLoading(false);
          return;
        }

        try {
          const res = await api.get('/auth/me');
          setUser({ token, ...res.data });
          if (res.data.theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }
        } catch (err) {
          console.error("Failed to load user session", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTime');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser({ token, ...userData });
    if (userData.theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const toggleTheme = async () => {
    if (!user) return;
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';
    
    // Update DOM instantly
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Update local state instantly
    updateUser({ theme: newTheme });
    
    // Persist to backend
    try {
      await api.put('/users/profile', { theme: newTheme });
    } catch (err) {
      console.error("Failed to save theme to backend", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
