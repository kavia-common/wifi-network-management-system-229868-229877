import React from "react";

// PUBLIC_INTERFACE
function DashboardPage() {
  /** Placeholder dashboard page. */
  return (
    <section className="card">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Overview of WiFi health, connected clients, and recent changes (coming
        soon).
      </p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="card" style={{ boxShadow: "none" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Networks</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
        <div className="card" style={{ boxShadow: "none" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Clients</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
        <div className="card" style={{ boxShadow: "none" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Alerts</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
