import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
function NetworkDetailPage() {
  /** Placeholder network details page (routing scaffold). */
  const { networkId } = useParams();

  return (
    <section className="card">
      <h1 className="page-title">Network Details</h1>
      <p className="page-subtitle">
        Network ID: <strong>{networkId}</strong>
      </p>

      <div className="card" style={{ boxShadow: "none" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          This is a scaffold for the detail view. Configuration forms and API
          integration will be added later.
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        <Link to="/networks" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Back to Networks
        </Link>
      </div>
    </section>
  );
}

export default NetworkDetailPage;
