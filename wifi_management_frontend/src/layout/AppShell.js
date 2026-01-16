import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavigationSidebar } from "../components/NavigationSidebar";
import { TopHeader } from "../components/TopHeader";
import { alertService } from "../services";

function pageTitleFromPath(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/networks")) return "Networks";
  if (pathname.startsWith("/access-points")) return "Access Points";
  if (pathname.startsWith("/clients")) return "Devices / Clients";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/admin/users")) return "Admin / Users";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/login")) return "Login";
  return "WiFi Manager";
}

function statusFromPath(pathname) {
  if (pathname.startsWith("/alerts")) return { label: "Attention required", variant: "warning" };
  return { label: "Network healthy", variant: "primary" };
}

// PUBLIC_INTERFACE
export function AppShell() {
  /** Main app chrome: sidebar + header + routed content outlet. */
  const location = useLocation();
  const title = useMemo(() => pageTitleFromPath(location.pathname), [location.pathname]);
  const status = useMemo(() => statusFromPath(location.pathname), [location.pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    // Close sidebar on route change (mobile).
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    alertService
      .list()
      .then((alerts) => {
        if (!mounted) return;
        setAlertCount(alerts.filter((a) => !a.acknowledged).length);
      })
      .catch(() => {
        // ignore; auth guards will redirect
      });
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  return (
    <div className="op-app">
      <div className="op-shell">
        <NavigationSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} alertCount={alertCount} />
        <main className="op-main">
          <TopHeader
            title={title}
            status={status}
            onOpenSidebar={() => setSidebarOpen(true)}
            searchValue={globalSearch}
            onSearchChange={setGlobalSearch}
          />
          <section className="op-content">
            <Outlet context={{ globalSearch }} />
          </section>
        </main>
      </div>
    </div>
  );
}
