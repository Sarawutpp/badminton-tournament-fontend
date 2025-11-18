// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { API } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {username, displayName, role}
  const [loading, setLoading] = useState(true); // เช็ค session ตอน mount
  const [error, setError] = useState(null);

  // เรียก /auth/me ตอน mount เพื่อดูว่า login อยู่ไหม
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setError(null);
        const res = await API.getMe();
        if (!cancelled && res?.user) {
          setUser(res.user);
        }
      } catch (err) {
        // ไม่ต้องทำอะไร (ถือว่าเป็น guest)
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login({ username, password }) {
    setError(null);
    const res = await API.login({ username, password });
    if (res?.user) {
      setUser(res.user);
    }
    return res.user;
  }

  async function logout() {
    try {
      await API.logout();
    } catch (err) {
      // เงียบๆ ไปได้
    }
    setUser(null);
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth ต้องถูกใช้ภายใน <AuthProvider>");
  }
  return ctx;
}
