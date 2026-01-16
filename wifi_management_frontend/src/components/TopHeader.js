import React from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useAppState } from "../state/AppStateContext";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function TopHeader({
  title,
  onOpenSidebar,
  searchValue,
  onSearchChange,
  status = { label: "Network healthy", variant: "primary" }
}) {
  /** Main header with burger, search, status pills, and theme/auth controls. */
  const { theme, toggleTheme } = useAppState();
  const { user, isAuthed, login, logout } = useAuth();

  const onQuickLogin = async () => {
    // Simple placeholder login: default to admin
    await login("admin@ocean.local");
  };

  return (
    <header className="op-header">
      <div className="op-headerRow">
        <div className="op-headerLeft">
          <Button variant="ghost" size="sm" onClick={onOpenSidebar} className="op-burger" aria-label="Open navigation">
            Menu
          </Button>
          <div className="op-pageTitle">{title}</div>
        </div>

        <div style={{ flex: 1, maxWidth: 520 }}>
          <input
            className="op-input"
            placeholder="Search networks, APs, clients…"
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Global search"
          />
        </div>

        <div className="op-statusPills">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "Dark" : "Light"}
          </Button>
          {isAuthed ? (
            <Button size="sm" variant="ghost" onClick={logout}>
              Logout ({user?.name?.split(" ")[0] || user?.role})
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={onQuickLogin}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
