import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatCards } from "../components/StatCards";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { ErrorState, LoadingState } from "../components/States";
import { accessPointService, alertService, clientService } from "../services";
import { useToasts } from "../state/ToastContext";

function severityBadge(sev) {
  if (sev === "critical") return <Badge variant="danger">Critical</Badge>;
  if (sev === "warning") return <Badge variant="warning">Warning</Badge>;
  return <Badge variant="primary">Info</Badge>;
}

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Dashboard KPIs, recent alerts, and quick actions. */
  const nav = useNavigate();
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aps, setAps] = useState([]);
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, al] = await Promise.all([accessPointService.list(), clientService.list(), alertService.list()]);
      setAps(a);
      setClients(c);
      setAlerts(al);
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

  const stats = useMemo(() => {
    const online = aps.filter((x) => x.status === "online").length;
    const degraded = aps.filter((x) => x.status === "degraded").length;
    const connected = clients.length;
    const bandwidth = clients.reduce((sum, c) => sum + (c.rxMbps || 0) + (c.txMbps || 0), 0);

    return [
      {
        key: "aps",
        label: "Online access points",
        value: `${online}/${aps.length}`,
        delta: degraded ? `${degraded} degraded` : "All clear",
        deltaColor: degraded ? "var(--op-secondary)" : "var(--op-muted)",
        badge: { variant: online === aps.length ? "primary" : "warning", text: online === aps.length ? "Healthy" : "Partial" }
      },
      {
        key: "clients",
        label: "Connected clients",
        value: connected,
        delta: `${clients.filter((c) => c.blocked).length} blocked`,
        deltaColor: "var(--op-muted)",
        badge: { variant: "primary", text: "Live" }
      },
      {
        key: "bw",
        label: "Estimated bandwidth",
        value: `${Math.round(bandwidth)} Mbps`,
        delta: "Mock telemetry",
        deltaColor: "var(--op-muted)",
        badge: { variant: "warning", text: "Simulated" }
      }
    ];
  }, [aps, clients]);

  if (loading) return <LoadingState title="Loading dashboard…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="op-grid">
      <StatCards stats={stats} />

      <div className="op-twoCol">
        <div className="op-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Recent alerts</div>
            <Button size="sm" variant="ghost" onClick={() => nav("/alerts")}>
              View all
            </Button>
          </div>
          <div className="op-divider" />
          <div className="op-grid" style={{ gap: 10 }}>
            {recentAlerts.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{a.title}</div>
                  <div style={{ color: "var(--op-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.description}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {severityBadge(a.severity)}
                  {a.acknowledged ? <Badge>Ack</Badge> : <Badge variant="warning">New</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="op-card">
          <div style={{ fontWeight: 900 }}>Quick actions</div>
          <div className="op-divider" />
          <div className="op-actionsRow">
            <Button variant="primary" onClick={() => nav("/networks")}>
              Manage SSIDs
            </Button>
            <Button onClick={() => nav("/access-points")}>Check AP status</Button>
            <Button onClick={() => nav("/clients")}>View clients</Button>
            <Button
              variant="ghost"
              onClick={() => {
                toasts.pushSuccess("Action queued", "Mock backend will apply changes shortly.");
              }}
            >
              Run health check
            </Button>
          </div>

          <div className="op-divider" />

          <div className="op-state">
            Tip: Use optimistic actions in Clients and Networks to simulate real operational workflows.
          </div>
        </div>
      </div>
    </div>
  );
}
