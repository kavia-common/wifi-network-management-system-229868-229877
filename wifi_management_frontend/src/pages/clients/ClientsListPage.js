import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { clientsService, networksService } from "../../api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  FormField,
  LoadingSkeleton,
  SortableTh,
  Table,
  TableWrap,
} from "../../components/ui";

function normalizeApiErrorMessage(err) {
  const msg = err?.api?.message || err?.message;
  return String(msg || "Unexpected error");
}

function toComparable(v) {
  if (v === null || typeof v === "undefined") return "";
  return String(v);
}

function safeNumber(v, fallback = null) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function statusToBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return { variant: "success", label: "Online" };
  if (s === "offline") return { variant: "warn", label: "Offline" };
  if (s === "blocked") return { variant: "error", label: "Blocked" };
  return { variant: "info", label: s ? s.replace(/^\w/, (c) => c.toUpperCase()) : "Unknown" };
}

function computeRssiLabel(rssi) {
  // RSSI dBm: closer to 0 is better. Typical ranges: -30 excellent, -67 good, -80 poor.
  if (rssi === null) return { variant: "info", label: "—" };
  if (rssi >= -60) return { variant: "success", label: `${rssi} dBm (Strong)` };
  if (rssi >= -75) return { variant: "warn", label: `${rssi} dBm (Fair)` };
  return { variant: "error", label: `${rssi} dBm (Weak)` };
}

function applySort(rows, sortState) {
  const { key, direction } = sortState || {};
  if (!key) return rows;

  const next = [...rows];
  next.sort((a, b) => {
    const avRaw = a?.[key];
    const bvRaw = b?.[key];

    // Special-case RSSI: numeric sort with null last
    if (key === "rssi") {
      const av = safeNumber(avRaw, null);
      const bv = safeNumber(bvRaw, null);

      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;

      const cmp = av - bv;
      return direction === "desc" ? -cmp : cmp;
    }

    const av = toComparable(avRaw);
    const bv = toComparable(bvRaw);

    // Stable-ish string sort, treat numbers when possible
    const an = Number(av);
    const bn = Number(bv);
    const bothNumeric = Number.isFinite(an) && Number.isFinite(bn);

    let cmp = 0;
    if (bothNumeric) cmp = an - bn;
    else cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });

    return direction === "desc" ? -cmp : cmp;
  });

  return next;
}

/**
 * Attempt to normalize a "client record" from either:
 * - mock shape: { id, name, ip, status, rssi, networkId }
 * - potential backend variants: { mac, macAddress, ipAddress, ssid, lastSeen, ... }
 */
function normalizeClient(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  const id = String(c.id || c.mac || c.macAddress || "").trim();
  return {
    id,
    name: c.name || c.hostname || c.deviceName || "Unknown device",
    ip: c.ip || c.ipAddress || "—",
    status: c.status || "unknown",
    rssi: typeof c.rssi === "number" ? c.rssi : safeNumber(c.rssi, null),
    networkId: c.networkId || c.ssidId || c.ssid || "",
    lastSeen: c.lastSeen || c.last_seen || c.lastSeenAt || null,
    // Local/optional state; some backends may call this differently.
    blocked:
      typeof c.blocked === "boolean"
        ? c.blocked
        : String(c.status || "").toLowerCase() === "blocked",
  };
}

// PUBLIC_INTERFACE
function ClientsListPage() {
  /** Clients list view: searchable/filterable/sortable table with block/allow actions wired to clientsService. */
  const [items, setItems] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|online|offline|blocked|unknown
  const [networkFilter, setNetworkFilter] = useState("all"); // all|<networkId>
  const [rssiMin, setRssiMin] = useState(""); // string input, parse to number
  const [rssiMax, setRssiMax] = useState("");

  const [sortState, setSortState] = useState({ key: "name", direction: "asc" });

  // Busy map for per-row operations (block/allow)
  const [rowBusy, setRowBusy] = useState({}); // { [id]: { block?: bool } }

  const didInitRef = useRef(false);

  const setBusy = useCallback((id, patch) => {
    setRowBusy((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const updateClientLocally = useCallback((id, patch) => {
    setItems((prev) => prev.map((c) => (c?.id === id ? { ...c, ...patch } : c)));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [cs, ns] = await Promise.all([
        clientsService.list(),
        // networks are used only for an optional filter + rendering SSID labels
        networksService.list().catch(() => []),
      ]);

      const normalized = (Array.isArray(cs) ? cs : []).map(normalizeClient).filter((c) => c.id);
      setItems(normalized);

      setNetworks(Array.isArray(ns) ? ns : []);
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  if (!didInitRef.current) {
    didInitRef.current = true;
    // eslint-disable-next-line no-void
    void fetchAll();
  }

  const onSort = useCallback((key) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }, []);

  const networkIdToName = useMemo(() => {
    const map = new Map();
    (Array.isArray(networks) ? networks : []).forEach((n) => {
      const id = String(n?.id || "");
      if (!id) return;
      map.set(id, String(n?.name || id));
    });
    return map;
  }, [networks]);

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    const min = rssiMin.trim() === "" ? null : safeNumber(rssiMin, null);
    const max = rssiMax.trim() === "" ? null : safeNumber(rssiMax, null);

    return items.filter((c) => {
      // search
      if (q) {
        const hay = [c?.name, c?.id, c?.ip, c?.status, c?.networkId]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }

      // status filter
      if (statusFilter !== "all") {
        const s = String(c?.status || "").toLowerCase();
        const derived = c?.blocked ? "blocked" : s;
        if (derived !== statusFilter) return false;
      }

      // network filter
      if (networkFilter !== "all") {
        if (String(c?.networkId || "") !== String(networkFilter)) return false;
      }

      // RSSI filters (ignore rows with null RSSI when range is specified)
      const rssi = safeNumber(c?.rssi, null);
      if ((min !== null || max !== null) && rssi === null) return false;
      if (min !== null && rssi !== null && rssi < min) return false;
      if (max !== null && rssi !== null && rssi > max) return false;

      return true;
    });
  }, [items, networkFilter, query, rssiMax, rssiMin, statusFilter]);

  const rows = useMemo(() => applySort(filtered, sortState), [filtered, sortState]);

  const showEmpty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  const onToggleBlock = useCallback(
    async (client) => {
      const id = String(client?.id || "");
      if (!id) return;

      setErrorMessage("");
      setBusy(id, { block: true });

      // Optimistic toggle. We update both `blocked` and `status` to remain compatible with mock/placeholder APIs.
      const currentlyBlocked = Boolean(client?.blocked) || String(client?.status || "").toLowerCase() === "blocked";
      const nextBlocked = !currentlyBlocked;

      const prevSnapshot = { blocked: client?.blocked, status: client?.status };
      updateClientLocally(id, { blocked: nextBlocked, status: nextBlocked ? "blocked" : client?.status || "online" });

      try {
        // Existing clientsService doesn't have a dedicated block endpoint; use update with a minimal payload.
        // Backends can map `blocked` or `status` as they prefer.
        await clientsService.update(id, { blocked: nextBlocked, status: nextBlocked ? "blocked" : "online" });
      } catch (e) {
        // Roll back on failure
        updateClientLocally(id, prevSnapshot);
        setErrorMessage(normalizeApiErrorMessage(e));
      } finally {
        setBusy(id, { block: false });
      }
    },
    [setBusy, updateClientLocally]
  );

  return (
    <Card as="section">
      <h1 className="page-title">Clients</h1>
      <p className="page-subtitle">
        View connected devices, signal strength, and block/allow controls. Data is loaded from the existing API service
        (or deterministic mocks when <span className="mono">useMocks</span> is enabled).
      </p>

      {errorMessage ? (
        <ErrorBanner title="Clients failed to load" message={errorMessage} onRetry={fetchAll} />
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "end",
          marginTop: 8,
        }}
      >
        <FormField label="Search" help="Search by name, MAC, IP, status, or SSID id.">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. laptop, aa:bb…, 192.168…"
          />
        </FormField>

        <FormField label="Status" help="Filter clients by connection state.">
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="blocked">Blocked</option>
            <option value="unknown">Unknown</option>
          </select>
        </FormField>

        <FormField label="Network" help="Optional filter by SSID/network.">
          <select className="select" value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)}>
            <option value="all">All networks</option>
            {(Array.isArray(networks) ? networks : []).map((n) => {
              const id = String(n?.id || "");
              if (!id) return null;
              return (
                <option key={id} value={id}>
                  {String(n?.name || id)}
                </option>
              );
            })}
          </select>
        </FormField>

        <FormField label="RSSI min (dBm)" help="Show only clients with RSSI above this threshold.">
          <input
            className="input"
            inputMode="numeric"
            placeholder="-75"
            value={rssiMin}
            onChange={(e) => setRssiMin(e.target.value)}
          />
        </FormField>

        <FormField label="RSSI max (dBm)" help="Show only clients with RSSI below this threshold.">
          <input
            className="input"
            inputMode="numeric"
            placeholder="-30"
            value={rssiMax}
            onChange={(e) => setRssiMax(e.target.value)}
          />
        </FormField>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setNetworkFilter("all");
              setRssiMin("");
              setRssiMax("");
            }}
            disabled={loading}
          >
            Clear filters
          </Button>
          <Button variant="ghost" loading={loading} onClick={fetchAll}>
            Refresh
          </Button>
        </div>
      </div>

      <Card flat style={{ padding: 0, marginTop: 12 }}>
        {loading ? (
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, marginBottom: 10 }}>
              Loading clients…
            </div>
            <LoadingSkeleton lines={6} />
          </div>
        ) : showEmpty ? (
          <div style={{ padding: 14 }}>
            <EmptyState
              title={items.length === 0 ? "No clients found" : "No results"}
              description={
                items.length === 0
                  ? "No clients were returned from the service. Try refreshing or enable mocks."
                  : "Try adjusting your search query and filters."
              }
              icon="C"
              actionLabel={items.length === 0 ? "Refresh" : "Clear filters"}
              onAction={items.length === 0 ? fetchAll : () => {
                setQuery("");
                setStatusFilter("all");
                setNetworkFilter("all");
                setRssiMin("");
                setRssiMax("");
              }}
            />
          </div>
        ) : (
          <TableWrap aria-label="Clients table">
            <Table>
              <thead>
                <tr>
                  <SortableTh sortKey="name" sortState={sortState} onSort={onSort}>
                    Device
                  </SortableTh>
                  <SortableTh sortKey="id" sortState={sortState} onSort={onSort}>
                    MAC
                  </SortableTh>
                  <SortableTh sortKey="ip" sortState={sortState} onSort={onSort}>
                    IP
                  </SortableTh>
                  <SortableTh sortKey="networkId" sortState={sortState} onSort={onSort}>
                    SSID
                  </SortableTh>
                  <SortableTh sortKey="rssi" sortState={sortState} onSort={onSort}>
                    RSSI
                  </SortableTh>
                  <SortableTh sortKey="status" sortState={sortState} onSort={onSort}>
                    Status
                  </SortableTh>
                  <th scope="col" style={{ width: 320 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const id = String(c?.id || "");
                  const busy = rowBusy[id] || {};
                  const status = c?.blocked ? "blocked" : c?.status;
                  const statusBadge = statusToBadge(status);

                  const rssi = safeNumber(c?.rssi, null);
                  const rssiInfo = computeRssiLabel(rssi);

                  const ssidLabel = c?.networkId
                    ? networkIdToName.get(String(c.networkId)) || String(c.networkId)
                    : "—";

                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 900 }}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <span>{c?.name || "Unknown device"}</span>
                          {c?.lastSeen ? (
                            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                              Last seen: {new Date(c.lastSeen).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="mono" style={{ color: "var(--muted)", fontWeight: 800 }}>
                        {id}
                      </td>
                      <td style={{ color: "var(--muted)", fontWeight: 700 }}>{c?.ip || "—"}</td>
                      <td style={{ color: "var(--muted)", fontWeight: 700 }}>{ssidLabel}</td>
                      <td>
                        <Badge variant={rssiInfo.variant} title={rssi === null ? "No RSSI reported" : undefined}>
                          {rssiInfo.label}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <Link
                            to={`/clients/${encodeURIComponent(id)}`}
                            style={{ color: "var(--primary)", fontWeight: 900 }}
                          >
                            View
                          </Link>

                          <Button
                            variant={c?.blocked ? "primary" : "secondary"}
                            loading={Boolean(busy.block)}
                            onClick={() => onToggleBlock(c)}
                            title="Optimistic update; rolls back on error"
                          >
                            {c?.blocked ? "Allow" : "Block"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </Card>
  );
}

export default ClientsListPage;
