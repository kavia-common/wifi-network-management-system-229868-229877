import React from "react";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, Table, TableWrap } from "../../components/ui";

const stubClients = [
  { id: "aa:bb:cc:dd:ee:ff", name: "Laptop", ip: "192.168.1.23", status: "online" },
  { id: "11:22:33:44:55:66", name: "Phone", ip: "192.168.1.52", status: "online" },
];

// PUBLIC_INTERFACE
function ClientsListPage() {
  /** Placeholder clients listing page with scaffolded navigation to client details. */
  return (
    <Card as="section">
      <h1 className="page-title">Clients</h1>
      <p className="page-subtitle">
        View connected devices, signal strength, and block/allow controls (coming soon).
      </p>

      <Card flat style={{ padding: 0 }}>
        {stubClients.length === 0 ? (
          <div style={{ padding: 14 }}>
            <EmptyState
              title="No clients connected"
              description="When devices connect to your networks, they'll appear here."
              icon="C"
            />
          </div>
        ) : (
          <TableWrap aria-label="Clients table">
            <Table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">MAC</th>
                  <th scope="col">IP</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ width: 120 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {stubClients.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 800 }}>{c.name}</td>
                    <td className="mono" style={{ color: "var(--muted)" }}>
                      {c.id}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{c.ip}</td>
                    <td>
                      <Badge variant="success">Online</Badge>
                    </td>
                    <td>
                      <Link
                        to={`/clients/${encodeURIComponent(c.id)}`}
                        style={{ color: "var(--primary)", fontWeight: 800 }}
                      >
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

export default ClientsListPage;
