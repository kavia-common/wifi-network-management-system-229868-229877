import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ErrorState, LoadingState } from "../components/States";
import { userService } from "../services";
import { useToasts } from "../state/ToastContext";

function roleBadge(role) {
  if (role === "admin") return <Badge variant="primary">Admin</Badge>;
  if (role === "operator") return <Badge variant="warning">Operator</Badge>;
  return <Badge>Viewer</Badge>;
}

// PUBLIC_INTERFACE
export function AdminUsersPage() {
  /** Admin page to view users, roles, and enable/disable accounts (mock). */
  const toasts = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.list();
      setUsers(data);
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

  const columns = useMemo(() => {
    return [
      { key: "name", header: "Name", sortable: true, render: (r) => <strong>{r.name}</strong> },
      { key: "email", header: "Email", sortable: true },
      { key: "role", header: "Role", sortable: true, render: (r) => roleBadge(r.role) },
      { key: "enabled", header: "Status", sortable: true, render: (r) => (r.enabled ? <Badge variant="primary">Enabled</Badge> : <Badge variant="danger">Disabled</Badge>) },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (r) => (
          <div className="op-actionsRow" style={{ justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant={r.enabled ? "danger" : "primary"}
              onClick={() => {
                const prev = users;
                setUsers((p) => p.map((u) => (u.id === r.id ? { ...u, enabled: !u.enabled } : u)));
                userService
                  .update(r.id, { enabled: !r.enabled })
                  .then(() => toasts.pushSuccess("User updated", `${r.email} ${!r.enabled ? "enabled" : "disabled"}`))
                  .catch((e) => {
                    setUsers(prev);
                    toasts.pushError("Update failed", e.message);
                  });
              }}
            >
              {r.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        )
      }
    ];
  }, [users, toasts]);

  if (loading) return <LoadingState title="Loading users…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="op-card">
      <div style={{ fontWeight: 900 }}>Admin / Users</div>
      <div className="op-divider" />
      <DataTable columns={columns} rows={users} initialSort={{ key: "name", dir: "asc" }} pageSize={8} />
    </div>
  );
}
