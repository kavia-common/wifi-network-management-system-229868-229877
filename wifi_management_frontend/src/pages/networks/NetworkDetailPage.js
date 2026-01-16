import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, ConfirmDialog, FormField } from "../../components/ui";

// PUBLIC_INTERFACE
function NetworkDetailPage() {
  /** Placeholder network details page (routing scaffold) using reusable UI components. */
  const { networkId } = useParams();

  const [ssid, setSsid] = useState(networkId || "");
  const [band, setBand] = useState("Dual-band");
  const [security, setSecurity] = useState("WPA2");
  const [showConfirm, setShowConfirm] = useState(false);

  const derivedStatus = useMemo(() => {
    return { variant: "info", label: "Stubbed" };
  }, []);

  return (
    <Card as="section">
      <h1 className="page-title">Network Details</h1>
      <p className="page-subtitle">
        Network ID: <strong>{networkId}</strong> <Badge variant={derivedStatus.variant}>{derivedStatus.label}</Badge>
      </p>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Configuration (stub)</div>

          <div className="form-grid cols-2" style={{ marginTop: 12 }}>
            <FormField label="SSID" help="Human-friendly network name (placeholder).">
              <input className="input" value={ssid} onChange={(e) => setSsid(e.target.value)} />
            </FormField>

            <FormField label="Band">
              <select className="select" value={band} onChange={(e) => setBand(e.target.value)}>
                <option>Dual-band</option>
                <option>2.4GHz</option>
                <option>5GHz</option>
              </select>
            </FormField>

            <FormField label="Security">
              <select className="select" value={security} onChange={(e) => setSecurity(e.target.value)}>
                <option>WPA2</option>
                <option>WPA3</option>
                <option>Open</option>
              </select>
            </FormField>

            <FormField
              label="Notes"
              help="This form is not persisted yet; it demonstrates reusable components."
            >
              <textarea className="textarea" rows={3} defaultValue="" />
            </FormField>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" disabled>
              Save (soon)
            </Button>
            <Button variant="ghost" onClick={() => setShowConfirm(true)}>
              Reset (confirm)
            </Button>
          </div>
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>About</div>
          <p style={{ marginTop: 10, marginBottom: 0, color: "var(--muted)", lineHeight: 1.55 }}>
            This is a scaffold for the detail view. Configuration forms and API integration will be added later.
          </p>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Link to="/networks" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Back to Networks
        </Link>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Reset changes?"
        description="This will revert the local (stub) form values back to the route ID. This does not call the backend."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setSsid(networkId || "");
          setBand("Dual-band");
          setSecurity("WPA2");
          setShowConfirm(false);
        }}
      />
    </Card>
  );
}

export default NetworkDetailPage;
