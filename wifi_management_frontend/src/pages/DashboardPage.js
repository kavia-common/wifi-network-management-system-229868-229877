import React, { useMemo, useState } from "react";
import { Badge, Button, Card, ErrorBanner, LoadingSkeleton } from "../components/ui";

// PUBLIC_INTERFACE
function DashboardPage() {
  /** Placeholder dashboard page using reusable UI components. */
  const [loading, setLoading] = useState(false);

  const status = useMemo(() => {
    // Stubbed status for UI wiring only.
    return { variant: "success", label: "Healthy" };
  }, []);

  return (
    <Card as="section">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Overview of WiFi health, connected clients, and recent changes (coming soon).
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Badge variant={status.variant}>System: {status.label}</Badge>
        <Button
          variant="ghost"
          loading={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 700);
          }}
        >
          Refresh (stub)
        </Button>
      </div>

      <div className="grid auto-fit-cards" style={{ marginTop: 12 }}>
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Networks</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </Card>
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Clients</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </Card>
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Alerts</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>—</div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }} className="stack">
        {loading ? (
          <Card flat>
            <LoadingSkeleton lines={4} />
          </Card>
        ) : null}

        {/* Demonstrates ErrorBanner without affecting routing / functionality */}
        <ErrorBanner
          title="Demo banner"
          message="This is a placeholder UI wiring example. Backend integration will replace this later."
        />
      </div>
    </Card>
  );
}

export default DashboardPage;
