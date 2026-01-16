import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { ErrorState, LoadingState } from "../components/States";
import { accessPointService, networkService } from "../services";
import { useAppState } from "../state/AppStateContext";

function statusBadge(status) {
  if (status === "online") return <Badge variant="primary">Online</Badge>;
  if (status === "degraded") return <Badge variant="warning">Degraded</Badge>;
  return <Badge variant="danger">Offline</Badge>;
}

// PUBLIC_INTERFACE
export function AccessPointsPage() {
  /** List access points with status/channel/throughput and navigate to details page. */
  const { globalSearch } = useOutletContext() || {};
  const { selectedApId, setSelectedApId } = useAppState();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aps, setAps] = useState([]);
  const [networks, setNetworks] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, n] = await Promise.all([accessPointService.list(), networkService.list()]);
      setAps(a);
      setNetworks(n);
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
    if (!q) return aps;
    return aps.filter((ap) => `${ap.name} ${ap.site} ${ap.status} ${ap.channel}`.toLowerCase().includes(q));
  }, [aps, globalSearch]);

  const columns = useMemo(() => {
    return [
      {
        key: "name",
        header: "Access Point",
        sortable: true,
        render: (r) => (
          <div>
            <div style={{ fontWeight: 900 }}>
              <Link to={`/access-points/${r.id}`} onClick={() => setSelectedApId(r.id)}>
                {r.name}
              </Link>
            </div>
            <div style={{ color: "var(--op-muted)", fontSize: 12 }}>{r.site}</div>
          </div>
        )
      },
      { key: "status", header: "Status", sortable: true, render: (r) => statusBadge(r.status) },
      { key: "channel", header: "Channel", sortable: true },
      {
        key: "throughputMbps",
        header: "Throughput",
        sortable: true,
        render: (r) => `${r.throughputMbps} Mbps`
      },
      {
        key: "networkId",
        header: "Network",
        sortable: true,
        render: (r) => networks.find((n) => n.id === r.networkId)?.ssid || "—"
      },
      {
        key: "selected",
        header: "Context",
        sortable: false,
        render: (r) => (r.id === selectedApId ? <Badge variant="primary">Selected</Badge> : <Badge>—</Badge>)
      }
    ];
  }, [networks, selectedApId, setSelectedApId]);

  if (loading) return <LoadingState title="Loading access points…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="op-card">
      <div style={{ fontWeight: 900 }}>Access points</div>
      <div className="op-divider" />
      <DataTable columns={columns} rows={filtered} initialSort={{ key: "name", dir: "asc" }} pageSize={8} />
    </div>
  );
}
