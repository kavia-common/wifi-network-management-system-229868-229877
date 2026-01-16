import React from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card } from "../../components/ui";

// PUBLIC_INTERFACE
function ClientDetailPage() {
  /** Placeholder client details page (routing scaffold) using reusable UI components. */
  const { clientId } = useParams();

  return (
    <Card as="section">
      <h1 className="page-title">Client Details</h1>
      <p className="page-subtitle">
        Client ID: <strong>{clientId}</strong> <Badge variant="info">Stub</Badge>
      </p>

      <div className="grid auto-fit-cards">
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Status</div>
          <div style={{ marginTop: 8 }}>
            <Badge variant="success">Online</Badge>
          </div>
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Actions</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            <Button variant="secondary" disabled>
              Block (soon)
            </Button>
            <Button variant="ghost" disabled>
              Rename (soon)
            </Button>
          </div>
        </Card>
      </div>

      <Card flat style={{ marginTop: 12 }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          This is a scaffold for the detail view. Client metrics and actions will be added later.
        </p>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Link to="/clients" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Back to Clients
        </Link>
      </div>
    </Card>
  );
}

export default ClientDetailPage;
