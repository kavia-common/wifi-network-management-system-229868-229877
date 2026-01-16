import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides mock authentication session and role-based access helpers. */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authService
      .getSession()
      .then((res) => {
        if (mounted) setUser(res.user || null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => {
    const role = user?.role || "anonymous";
    return {
      user,
      role,
      loading,
      isAuthed: Boolean(user),
      canAdmin: role === "admin",
      canOperate: role === "admin" || role === "operator",
      async login(email) {
        const res = await authService.login({ email });
        setUser(res.user);
        return res.user;
      },
      async logout() {
        await authService.logout();
        setUser(null);
      }
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
