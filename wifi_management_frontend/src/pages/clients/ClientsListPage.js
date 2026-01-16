import React from "react";
import { Link } from "react-router-dom";

const stubClients = [
  { id: "aa:bb:cc:dd:ee:ff", name: "Laptop", ip: "192.168.1.23" },
  { id: "11:22:33:44:55:66", name: "Phone", ip: "192.168.1.52" },
];

// PUBLIC_INTERFACE
function ClientsListPage() {
  /** Placeholder clients listing page with scaffolded navigation to client details. */
  return (
    <section className="card">
      <h1 className="page-title">Clients</h1>
      <p className="page-subtitle">
        View connected devices, signal strength, and block/allow controls (coming
        soon).
      </p>

      <div className="card card-flat" style={{ padding: 0 }}>
        <div className="table-wrap" aria-label="Clients table">
          <table className="table" role="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">MAC</th>
                <th scope="col">IP</th>
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
          </table>
        </div>
      </div>
    </section>
  );
}

export default ClientsListPage;
