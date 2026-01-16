import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/networks", label: "Networks", icon: "N" },
  { to: "/clients", label: "Clients", icon: "C" },
  { to: "/settings", label: "Settings", icon: "S" },
];

// PUBLIC_INTERFACE
function SidebarNav() {
  /** Primary left navigation used across the app. */
  return (
    <div>
      <div className="brand" aria-label="App brand">
        <div className="brand-badge" aria-hidden="true" />
        <div className="brand-title">
          <strong>WiFi Manager</strong>
          <span>Ocean Professional</span>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : undefined)}
            end={item.to === "/dashboard"}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default SidebarNav;
