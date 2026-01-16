import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import HeaderStatus from "./HeaderStatus";

/**
 * Maps routes to human-friendly titles for the header.
 * Keep this small and explicit for now; can be replaced with breadcrumb generation later.
 */
function getHeaderTitle(pathname) {
  if (pathname.startsWith("/networks/")) return "Network Details";
  if (pathname.startsWith("/networks")) return "Networks";
  if (pathname.startsWith("/clients/")) return "Client Details";
  if (pathname.startsWith("/clients")) return "Clients";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

// PUBLIC_INTERFACE
function AppLayout() {
  /** Persistent app shell with sidebar, header, and main outlet for nested routes. */
  const location = useLocation();

  const headerTitle = useMemo(
    () => getHeaderTitle(location.pathname),
    [location.pathname]
  );

  const crumb = useMemo(() => {
    // Simple crumb for now, showing current path; can be replaced by breadcrumb component later.
    return location.pathname;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <SidebarNav />
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div className="header-left">
            <div className="crumb" aria-label="Current route">
              {crumb}
            </div>
            <div className="title">{headerTitle}</div>
          </div>
          <div className="header-right">
            <HeaderStatus />
          </div>
        </header>

        <main className="app-content" role="main">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

export default AppLayout;
