import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
function ClientDetailPage() {
  /** Placeholder client details page (routing scaffold). */
  const { clientId } = useParams();

  return (
    <section className="card">
      <h1 className="page-title">Client Details</h1>
      <p className="page-subtitle">
        Client ID: <strong>{clientId}</strong>
      </p>

      <div className="card" style={{ boxShadow: "none" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          This is a scaffold for the detail view. Client metrics and actions will
          be added later.
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        <Link to="/clients" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Back to Clients
        </Link>
      </div>
    </section>
  );
}

export default ClientDetailPage;
