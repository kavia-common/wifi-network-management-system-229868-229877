import React from "react";
import { NavLink } from "react-router-dom";
import { Badge } from "./Badge";
import { useAuth } from "../state/AuthContext";

function navItems(canAdmin) {
  return [
    { to: "/", label: "Dashboard", icon: "D" },
    { to: "/networks", label: "Networks", icon: "N" },
    { to: "/access-points", label: "Access Points", icon: "AP" },
    { to: "/clients", label: "Devices / Clients", icon: "C" },
    { to: "/alerts", label: "Alerts", icon: "!" },
    ...(canAdmin ? [{ to: "/admin/users", label: "Admin / Users", icon: "A" }] : []),
    { to: "/settings", label: "Settings", icon: "S" }
  ];
}

// PUBLIC_INTERFACE
export function NavigationSidebar({ open, onClose, alertCount = 0 }) {
  /** Responsive sidebar navigation with overlay on mobile. */
  const { user, canAdmin } = useAuth();

  return (
    <>
      {open ? <div className="op-sidebarOverlay" onClick={onClose} aria-hidden="true" /> : null}
      <aside className="op-sidebar" data-open={open ? "true" : "false"} aria-label="Primary navigation">
        <div className="op-brand">
          <div className="op-logoMark" aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <div className="op-brandTitle">Ocean Professional</div>
            <div className="op-brandSub">
              {user ? (
                <>
                  Signed in as <strong>{user.role}</strong>
                </>
              ) : (
                "Not signed in"
              )}
            </div>
          </div>
        </div>

        <nav className="op-nav">
          {navItems(canAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="op-navItem"
              data-active={undefined}
              onClick={onClose}
              end={item.to === "/"}
            >
              {({ isActive }) => (
                <div className="op-navItem" data-active={isActive ? "true" : "false"}>
                  <div className="op-navItemLeft">
                    <div className="op-navIcon" aria-hidden="true">
                      {item.icon}
                    </div>
                    <div className="op-navLabel">{item.label}</div>
                  </div>
                  <div className="op-navMeta">
                    {item.to === "/alerts" && alertCount > 0 ? <Badge variant="warning">{alertCount}</Badge> : null}
                  </div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="op-divider" />

        <div className="op-state">
          <strong style={{ color: "var(--op-text)" }}>Keyboard</strong>
          <div style={{ marginTop: 6 }}>
            Use <span className="op-kbd">Tab</span> to navigate • <span className="op-kbd">Esc</span> closes modals
          </div>
        </div>
      </aside>
    </>
  );
}
