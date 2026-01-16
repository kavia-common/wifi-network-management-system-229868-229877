import React from "react";
import { Link } from "react-router-dom";

const stubClients = [
  { id: "aa:bb:cc:dd:ee:ff", name: "Laptop", ip: "192.168.1.23" },
  { id: "11:22:33:44:55:66", name: "Phone", ip: "192.168.1.52" },
];

// PUBLIC_INTERFACE
function ClientsListPage() {
  /** Placeholder clients listing page with scaffolded navigation to client details. */
  return (
    <section className="card">
      <h1 className="page-title">Clients</h1>
      <p className="page-subtitle">
        View connected devices, signal strength, and block/allow controls (coming
        soon).
      </p>

      <div className="card" style={{ boxShadow: "none", padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px 160px 120px",
            gap: 10,
            padding: 12,
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          <div>Name</div>
          <div>MAC</div>
          <div>IP</div>
          <div>Action</div>
        </div>

        {stubClients.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px 160px 120px",
              gap: 10,
              padding: 12,
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div style={{ color: "var(--muted)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
              {c.id}
            </div>
            <div style={{ color: "var(--muted)" }}>{c.ip}</div>
            <div>
              <Link to={`/clients/${encodeURIComponent(c.id)}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ClientsListPage;
