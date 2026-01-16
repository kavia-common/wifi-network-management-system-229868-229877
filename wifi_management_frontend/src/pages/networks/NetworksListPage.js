import React from "react";
import { Link } from "react-router-dom";

const stubNetworks = [
  { id: "home-ssid", name: "Home WiFi", band: "Dual-band", security: "WPA2" },
  { id: "guest-ssid", name: "Guest WiFi", band: "5GHz", security: "WPA2" },
];

// PUBLIC_INTERFACE
function NetworksListPage() {
  /** Placeholder networks listing page with scaffolded navigation to network details. */
  return (
    <section className="card">
      <h1 className="page-title">Networks</h1>
      <p className="page-subtitle">
        Manage SSIDs, security settings, and radio configuration (to be wired to
        backend later).
      </p>

      <div className="card card-flat" style={{ padding: 0 }}>
        <div className="table-wrap" aria-label="Networks table">
          <table className="table" role="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Band</th>
                <th scope="col">Security</th>
                <th scope="col" style={{ width: 120 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {stubNetworks.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 800 }}>{n.name}</td>
                  <td style={{ color: "var(--muted)" }}>{n.band}</td>
                  <td style={{ color: "var(--muted)" }}>{n.security}</td>
                  <td>
                    <Link
                      to={`/networks/${n.id}`}
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

export default NetworksListPage;
