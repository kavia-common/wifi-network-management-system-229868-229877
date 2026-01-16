import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ConfirmModal, Modal } from "../components/Modal";
import { ErrorState, LoadingState } from "../components/States";
import { NetworkForm } from "../components/NetworkForm";
import { networkService } from "../services";
import { useAppState } from "../state/AppStateContext";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

function enabledBadge(enabled) {
  return enabled ? <Badge variant="primary">Enabled</Badge> : <Badge>Disabled</Badge>;
}

// PUBLIC_INTERFACE
export function NetworksPage() {
  /** Create/edit SSID networks, security and VLAN settings, enable/disable. */
  const { globalSearch } = useOutletContext() || {};
  const { canOperate } = useAuth();
  const { selectedNetworkId, setSelectedNetworkId } = useAppState();
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await networkService.list();
      setRows(data);
      if (data.length && !data.some((n) => n.id === selectedNetworkId)) {
        setSelectedNetworkId(data[0].id);
      }
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

  const filteredRows = useMemo(() => {
    const q = (globalSearch || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.ssid} ${r.security} ${r.vlan}`.toLowerCase().includes(q));
  }, [rows, globalSearch]);

  const columns = useMemo(() => {
    return [
      {
        key: "ssid",
        header: "SSID",
        sortable: true,
        render: (r) => (
          <div>
            <div style={{ fontWeight: 900 }}>{r.ssid}</div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>VLAN {r.vlan}</div>
          </div>
        )
      },
      { key: "security", header: "Security", sortable: true },
      {
        key: "enabled",
        header: "Status",
        sortable: true,
        render: (r) => enabledBadge(r.enabled)
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (r) => (
          <div className="op-actionsRow" style={{ justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedNetworkId(r.id);
                toasts.pushSuccess("Selected network", r.ssid);
              }}
            >
              Select
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!canOperate}
              onClick={() => {
                setEditing(r);
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={r.enabled ? "ghost" : "primary"}
              disabled={!canOperate}
              onClick={() => {
                // Optimistic toggle
                const prev = rows;
                setRows((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
                networkService
                  .update(r.id, { enabled: !r.enabled })
                  .then(() => {
                    toasts.pushSuccess("Network updated", `${r.ssid} ${!r.enabled ? "enabled" : "disabled"}`);
                  })
                  .catch((e) => {
                    setRows(prev);
                    toasts.pushError("Update failed", e.message);
                  });
              }}
            >
              {r.enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled
              title="Delete is disabled in this mock template"
              onClick={() => null}
            >
              Delete
            </Button>
          </div>
        )
      }
    ];
  }, [canOperate, rows, selectedNetworkId, setSelectedNetworkId, toasts]);

  if (loading) return <LoadingState title="Loading networks…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="op-grid">
      <div className="op-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>SSID networks</div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>
              Selected: <strong>{rows.find((n) => n.id === selectedNetworkId)?.ssid || "—"}</strong>
            </div>
          </div>
          <div className="op-actionsRow">
            <Button
              variant="primary"
              disabled={!canOperate}
              onClick={() => {
                setEditing(null);
                setEditOpen(true);
              }}
            >
              New SSID
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmTarget({ title: "Reload", description: "Reload networks from mock backend?" });
                setConfirmOpen(true);
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="op-divider" />

        <DataTable
          columns={columns}
          rows={filteredRows}
          initialSort={{ key: "ssid", dir: "asc" }}
          filterPlaceholder="Filter SSIDs…"
          pageSize={8}
        />
      </div>

      <Modal
        open={editOpen}
        title={editing ? `Edit ${editing.ssid}` : "Create SSID"}
        onClose={() => setEditOpen(false)}
      >
        <NetworkForm
          initialValues={editing}
          submitText={editing ? "Update" : "Create"}
          onCancel={() => setEditOpen(false)}
          onSubmit={(payload) => {
            if (!canOperate) return;
            if (editing) {
              const prev = rows;
              setRows((p) => p.map((n) => (n.id === editing.id ? { ...n, ...payload } : n)));
              setEditOpen(false);
              networkService
                .update(editing.id, payload)
                .then((updated) => {
                  setRows((p) => p.map((n) => (n.id === updated.id ? updated : n)));
                  toasts.pushSuccess("Network updated", updated.ssid);
                })
                .catch((e) => {
                  setRows(prev);
                  toasts.pushError("Update failed", e.message);
                });
            } else {
              const prev = rows;
              setEditOpen(false);
              networkService
                .create(payload)
                .then((created) => {
                  setRows((p) => [created, ...p]);
                  setSelectedNetworkId(created.id);
                  toasts.pushSuccess("SSID created", created.ssid);
                })
                .catch((e) => {
                  setRows(prev);
                  toasts.pushError("Create failed", e.message);
                });
            }
          }}
        />
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title={confirmTarget?.title}
        description={confirmTarget?.description}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          load();
        }}
        confirmText="Reload"
      />
    </div>
  );
}
