// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem("tz_token");
    if (!token) { setLoading(false); return; }
    authAPI.getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem("tz_token"); localStorage.removeItem("tz_user"); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("tz_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem("tz_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tz_token");
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  }, []);

  const isAuthenticated = !!user;
  const isAdmin  = user?.role === "superadmin";
  const isSeller = user?.role === "seller" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
};
