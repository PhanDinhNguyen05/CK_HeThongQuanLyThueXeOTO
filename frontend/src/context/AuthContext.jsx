import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import { getToken, setToken } from '../api/client';
import { useData } from './DataContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { refreshForUser, clearPrivateData } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        if (cancelled) return;
        const user = res.data;
        setCurrentUser(user);
        await refreshForUser(user);
      } catch {
        if (!cancelled) {
          setToken('');
          setCurrentUser(null);
          clearPrivateData();
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (tenDN, matKhau) => {
    const username = String(tenDN || '').trim();
    const password = String(matKhau || '');

    if (!username || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
    }

    try {
      const res = await authApi.login({ TenDN: username, MatKhau: password });
      const { token, user } = res.data;
      setToken(token);
      setCurrentUser(user);
      await refreshForUser(user);
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.message || 'Đăng nhập thất bại.' };
    }
  };

  const register = async (payload) => {
    try {
      const res = await authApi.register(payload);
      return { success: true, data: res.data, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Đăng ký tài khoản thất bại.' };
    }
  };

  const logout = () => {
    setToken('');
    setCurrentUser(null);
    clearPrivateData();
  };

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
