import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppStateContext = createContext(null);

function safeLocalStorageGet(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** Provides app UI state (theme, selected network/AP context). */
  const [theme, setTheme] = useState(() => safeLocalStorageGet("op_theme", "light"));
  const [selectedNetworkId, setSelectedNetworkId] = useState(() => safeLocalStorageGet("op_selectedNetworkId", "net-staff"));
  const [selectedApId, setSelectedApId] = useState(() => safeLocalStorageGet("op_selectedApId", "ap-hq-1"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    safeLocalStorageSet("op_theme", theme);
  }, [theme]);

  useEffect(() => {
    safeLocalStorageSet("op_selectedNetworkId", selectedNetworkId);
  }, [selectedNetworkId]);

  useEffect(() => {
    safeLocalStorageSet("op_selectedApId", selectedApId);
  }, [selectedApId]);

  const value = useMemo(() => {
    return {
      theme,
      setTheme,
      toggleTheme() {
        setTheme((t) => (t === "light" ? "dark" : "light"));
      },
      selectedNetworkId,
      setSelectedNetworkId,
      selectedApId,
      setSelectedApId
    };
  }, [theme, selectedNetworkId, selectedApId]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /** Hook to access app state context. */
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
