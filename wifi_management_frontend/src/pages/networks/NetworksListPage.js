import React from "react";
import { Link } from "react-router-dom";

const stubNetworks = [
  { id: "home-ssid", name: "Home WiFi", band: "Dual-band", security: "WPA2" },
  { id: "guest-ssid", name: "Guest WiFi", band: "5GHz", security: "WPA2" },
];

// PUBLIC_INTERFACE
function NetworksListPage() {
  /** Placeholder networks listing page with scaffolded navigation to network details. */
  return (
    <section className="card">
      <h1 className="page-title">Networks</h1>
      <p className="page-subtitle">
        Manage SSIDs, security settings, and radio configuration (to be wired to
        backend later).
      </p>

      <div className="card" style={{ boxShadow: "none", padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px 120px 120px",
            gap: 10,
            padding: 12,
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          <div>Name</div>
          <div>Band</div>
          <div>Security</div>
          <div>Action</div>
        </div>

        {stubNetworks.map((n) => (
          <div
            key={n.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 120px 120px",
              gap: 10,
              padding: 12,
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700 }}>{n.name}</div>
            <div style={{ color: "var(--muted)" }}>{n.band}</div>
            <div style={{ color: "var(--muted)" }}>{n.security}</div>
            <div>
              <Link to={`/networks/${n.id}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NetworksListPage;
