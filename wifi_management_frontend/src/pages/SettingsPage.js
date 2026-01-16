import React, { useMemo, useState } from "react";
import { Badge, Button, Card, ErrorBanner, FormField } from "../components/ui";

// PUBLIC_INTERFACE
function SettingsPage() {
  /** Placeholder settings page using reusable UI components. */
  const [showBanner, setShowBanner] = useState(false);

  const env = useMemo(() => {
    return {
      apiBase: process.env.REACT_APP_API_BASE || "(unset)",
      wsUrl: process.env.REACT_APP_WS_URL || "(unset)",
      featureFlags: process.env.REACT_APP_FEATURE_FLAGS || "(unset)",
    };
  }, []);

  return (
    <Card as="section">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Application preferences, API endpoints, and feature flags (to be wired to configuration later).
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Badge variant="info">Read-only</Badge>
        <Button variant="ghost" onClick={() => setShowBanner((v) => !v)}>
          Toggle demo banner
        </Button>
      </div>

      {showBanner ? (
        <div style={{ marginTop: 12 }}>
          <ErrorBanner
            title="Demo notice"
            message="Settings editing is not implemented yet. This banner demonstrates the reusable ErrorBanner component."
          />
        </div>
      ) : null}

      <Card flat style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>
          Runtime configuration (read-only for now)
        </div>

        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <FormField label="REACT_APP_API_BASE" help="Base URL for backend REST API.">
            <input className="input" value={env.apiBase} readOnly />
          </FormField>

          <FormField label="REACT_APP_WS_URL" help="WebSocket base URL (planned).">
            <input className="input" value={env.wsUrl} readOnly />
          </FormField>

          <FormField label="REACT_APP_FEATURE_FLAGS" help="Feature flags payload (planned).">
            <input className="input" value={env.featureFlags} readOnly />
          </FormField>

          <FormField label="Environment">
            <input className="input" value={process.env.REACT_APP_NODE_ENV || "(unset)"} readOnly />
          </FormField>
        </div>
      </Card>
    </Card>
  );
}

export default SettingsPage;
