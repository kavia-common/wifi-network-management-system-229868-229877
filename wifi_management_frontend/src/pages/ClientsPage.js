import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ErrorState, LoadingState } from "../components/States";
import { clientService } from "../services";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

// PUBLIC_INTERFACE
export function ClientsPage() {
  /** Devices/clients list with MAC/IP, connection quality, and block/unblock actions. */
  const { globalSearch } = useOutletContext() || {};
  const { canOperate } = useAuth();
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.list();
      setClients(data);
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
    const q = (globalSearch || "").trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.name} ${c.mac} ${c.ip}`.toLowerCase().includes(q));
  }, [clients, globalSearch]);

  const columns = useMemo(() => {
    return [
      { key: "name", header: "Device", sortable: true, render: (r) => <strong>{r.name}</strong> },
      { key: "mac", header: "MAC", sortable: true },
      { key: "ip", header: "IP", sortable: true },
      {
        key: "quality",
        header: "Quality",
        sortable: true,
        render: (r) => (
          <span style={{ fontWeight: 900, color: r.quality < 55 ? "var(--op-secondary)" : "var(--op-text)" }}>{r.quality}%</span>
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
          <div className="op-actionsRow" style={{ justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant={r.blocked ? "primary" : "danger"}
              disabled={!canOperate}
              onClick={() => {
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
          </div>
        )
      }
    ];
  }, [clients, canOperate, toasts]);

  if (loading) return <LoadingState title="Loading clients…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="op-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>Devices / clients</div>
        <Badge>{clients.filter((c) => c.blocked).length} blocked</Badge>
      </div>
      <div className="op-divider" />
      <DataTable columns={columns} rows={filtered} initialSort={{ key: "quality", dir: "desc" }} pageSize={10} />
    </div>
  );
}
