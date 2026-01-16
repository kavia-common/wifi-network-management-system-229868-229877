import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { ErrorState, LoadingState } from "../components/States";
import { alertService } from "../services";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

function severityBadge(sev) {
  if (sev === "critical") return <Badge variant="danger">Critical</Badge>;
  if (sev === "warning") return <Badge variant="warning">Warning</Badge>;
  return <Badge variant="primary">Info</Badge>;
}

// PUBLIC_INTERFACE
export function AlertsPage() {
  /** Alerts list with severity filters and acknowledgement. */
  const { canOperate } = useAuth();
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [severity, setSeverity] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertService.list();
      setAlerts(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (severity === "all") return alerts;
    return alerts.filter((a) => a.severity === severity);
  }, [alerts, severity]);

  const columns = useMemo(() => {
    return [
      { key: "severity", header: "Severity", sortable: true, render: (r) => severityBadge(r.severity) },
      {
        key: "title",
        header: "Alert",
        sortable: true,
        render: (r) => (
          <div>
            <div style={{ fontWeight: 900 }}>{r.title}</div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>{r.description}</div>
          </div>
        )
      },
      {
        key: "acknowledged",
        header: "Status",
        sortable: true,
        render: (r) => (r.acknowledged ? <Badge>Ack</Badge> : <Badge variant="warning">New</Badge>)
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (r) => (
          <Button
            size="sm"
            variant={r.acknowledged ? "ghost" : "primary"}
            disabled={!canOperate}
            onClick={() => {
              const prev = alerts;
              setAlerts((p) => p.map((a) => (a.id === r.id ? { ...a, acknowledged: true } : a)));
              alertService
                .acknowledge(r.id, true)
                .then(() => toasts.pushSuccess("Acknowledged", r.title))
                .catch((e) => {
                  setAlerts(prev);
                  toasts.pushError("Update failed", e.message);
                });
            }}
          >
            {r.acknowledged ? "Acknowledged" : "Acknowledge"}
          </Button>
        )
      }
    ];
  }, [alerts, canOperate, toasts]);

  if (loading) return <LoadingState title="Loading alerts…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="op-grid">
      <div className="op-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Alerts</div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>Filter by severity and acknowledge issues.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--op-muted)" }}>
              Severity
              <select className="op-input" style={{ marginLeft: 8, width: 160 }} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </label>
            <Badge variant="warning">{alerts.filter((a) => !a.acknowledged).length} new</Badge>
          </div>
        </div>

        <div className="op-divider" />
        <DataTable columns={columns} rows={filtered} initialSort={{ key: "severity", dir: "asc" }} pageSize={8} />
      </div>
    </div>
  );
}
