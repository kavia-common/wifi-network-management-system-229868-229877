import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { ErrorState, LoadingState } from "../components/States";
import { accessPointService, clientService } from "../services";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

function statusBadge(status) {
  if (status === "online") return <Badge variant="primary">Online</Badge>;
  if (status === "degraded") return <Badge variant="warning">Degraded</Badge>;
  return <Badge variant="danger">Offline</Badge>;
}

// PUBLIC_INTERFACE
export function AccessPointDetailsPage() {
  /** Details view for a single access point including clients list and actions. */
  const { apId } = useParams();
  const { canOperate } = useAuth();
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ap, setAp] = useState(null);
  const [clients, setClients] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accessPointService.getById(apId);
      setAp(res);
      setClients(res.clients || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apId]);

  const columns = useMemo(() => {
    return [
      { key: "name", header: "Client", sortable: true, render: (r) => <strong>{r.name}</strong> },
      { key: "mac", header: "MAC", sortable: true },
      { key: "ip", header: "IP", sortable: true },
      {
        key: "quality",
        header: "Quality",
        sortable: true,
        render: (r) => (
          <span style={{ fontWeight: 800, color: r.quality < 55 ? "var(--op-secondary)" : "var(--op-text)" }}>{r.quality}%</span>
        )
      },
      {
        key: "blocked",
        header: "Access",
        sortable: true,
        render: (r) => (r.blocked ? <Badge variant="danger">Blocked</Badge> : <Badge variant="primary">Allowed</Badge>)
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (r) => (
          <Button
            size="sm"
            variant={r.blocked ? "primary" : "danger"}
            disabled={!canOperate}
            onClick={() => {
              // Optimistic
              const prev = clients;
              setClients((p) => p.map((c) => (c.id === r.id ? { ...c, blocked: !c.blocked } : c)));
              clientService
                .setBlocked(r.id, !r.blocked)
                .then(() => toasts.pushSuccess("Client updated", `${r.name} ${!r.blocked ? "blocked" : "unblocked"}`))
                .catch((e) => {
                  setClients(prev);
                  toasts.pushError("Update failed", e.message);
                });
            }}
          >
            {r.blocked ? "Unblock" : "Block"}
          </Button>
        )
      }
    ];
  }, [clients, canOperate, toasts]);

  if (loading) return <LoadingState title="Loading access point…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!ap) return null;

  return (
    <div className="op-grid">
      <div className="op-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{ap.name}</div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>
              Site: <strong>{ap.site}</strong> • Channel <strong>{ap.channel}</strong> • Uplink <strong>{ap.uplink}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {statusBadge(ap.status)}
            <Link to="/access-points">
              <Button size="sm" variant="ghost">
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="op-divider" />

        <div className="op-actionsRow">
          <Button
            variant="ghost"
            disabled={!canOperate}
            onClick={() => toasts.pushSuccess("Restart queued", "Mock adapter accepted restart request.")}
          >
            Restart AP
          </Button>
          <Button
            variant="ghost"
            disabled={!canOperate}
            onClick={() => toasts.pushSuccess("Channel optimization queued", "Mock adapter will adjust channels shortly.")}
          >
            Optimize channels
          </Button>
        </div>
      </div>

      <div className="op-card">
        <div style={{ fontWeight: 900 }}>Connected clients</div>
        <div className="op-divider" />
        <DataTable columns={columns} rows={clients} initialSort={{ key: "quality", dir: "desc" }} pageSize={8} />
      </div>
    </div>
  );
}
