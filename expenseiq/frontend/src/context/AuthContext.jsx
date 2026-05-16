import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// ── Tiny local "DB" stored in localStorage ────────────────────────────────────
const USERS_KEY = "expenseiq_users";
const TOKEN_KEY = "expenseiq_token";
const USER_KEY  = "expenseiq_user";

export function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
export function saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
// Make a fake JWT-like token (not cryptographic — just a stable opaque string)
export function makeToken(userId) {
  return btoa(JSON.stringify({ id: userId, ts: Date.now() }));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem(TOKEN_KEY, tokenVal);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading: false, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
