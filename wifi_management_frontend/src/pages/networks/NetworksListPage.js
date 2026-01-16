import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, SortableTh, Table, TableWrap } from "../../components/ui";

const stubNetworks = [
  { id: "home-ssid", name: "Home WiFi", band: "Dual-band", security: "WPA2", status: "active" },
  { id: "guest-ssid", name: "Guest WiFi", band: "5GHz", security: "WPA2", status: "active" },
];

// PUBLIC_INTERFACE
function NetworksListPage() {
  /** Placeholder networks listing page with scaffolded navigation to network details. */
  const [sortState, setSortState] = useState({ key: "name", direction: "asc" });

  const rows = useMemo(() => {
    // Placeholder local sort (simple) to demonstrate SortableTh hook wiring.
    const next = [...stubNetworks];
    next.sort((a, b) => {
      const av = String(a[sortState.key] ?? "");
      const bv = String(b[sortState.key] ?? "");
      const cmp = av.localeCompare(bv);
      return sortState.direction === "desc" ? -cmp : cmp;
    });
    return next;
  }, [sortState]);

  const onSort = (key) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <Card as="section">
      <h1 className="page-title">Networks</h1>
      <p className="page-subtitle">
        Manage SSIDs, security settings, and radio configuration (to be wired to backend later).
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Button variant="primary" disabled>
          Add Network (soon)
        </Button>
        <Button variant="ghost" disabled>
          Import (soon)
        </Button>
      </div>

      <Card flat style={{ padding: 0, marginTop: 12 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 14 }}>
            <EmptyState
              title="No networks yet"
              description="When networks are available, they'll appear here."
              actionLabel="Add Network"
              onAction={() => {}}
              icon="N"
            />
          </div>
        ) : (
          <TableWrap aria-label="Networks table">
            <Table>
              <thead>
                <tr>
                  <SortableTh sortKey="name" sortState={sortState} onSort={onSort}>
                    Name
                  </SortableTh>
                  <SortableTh sortKey="band" sortState={sortState} onSort={onSort}>
                    Band
                  </SortableTh>
                  <SortableTh sortKey="security" sortState={sortState} onSort={onSort}>
                    Security
                  </SortableTh>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ width: 140 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 800 }}>{n.name}</td>
                    <td style={{ color: "var(--muted)" }}>{n.band}</td>
                    <td style={{ color: "var(--muted)" }}>{n.security}</td>
                    <td>
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td>
                      <Link to={`/networks/${n.id}`} style={{ color: "var(--primary)", fontWeight: 800 }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </Card>
  );
}

export default NetworksListPage;
