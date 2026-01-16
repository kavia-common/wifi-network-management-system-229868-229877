import React from "react";

// PUBLIC_INTERFACE
function SettingsPage() {
  /** Placeholder settings page. */
  return (
    <section className="card">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Application preferences, API endpoints, and feature flags (to be wired to
        configuration later).
      </p>

      <div className="card" style={{ boxShadow: "none" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
          Runtime configuration (read-only for now)
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 13 }}>
          <div>
            <strong>REACT_APP_API_BASE:</strong>{" "}
            <span style={{ color: "var(--muted)" }}>
              {process.env.REACT_APP_API_BASE || "(unset)"}
            </span>
          </div>
          <div>
            <strong>REACT_APP_WS_URL:</strong>{" "}
            <span style={{ color: "var(--muted)" }}>
              {process.env.REACT_APP_WS_URL || "(unset)"}
            </span>
          </div>
          <div>
            <strong>REACT_APP_FEATURE_FLAGS:</strong>{" "}
            <span style={{ color: "var(--muted)" }}>
              {process.env.REACT_APP_FEATURE_FLAGS || "(unset)"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
