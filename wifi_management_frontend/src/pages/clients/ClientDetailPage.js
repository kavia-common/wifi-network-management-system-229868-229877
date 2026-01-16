import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsService, networksService } from "../../api";
import { Badge, Button, Card, EmptyState, ErrorBanner, LoadingSkeleton, getAriaErrorMessage } from "../../components/ui";

function normalizeApiErrorMessage(err) {
  return getAriaErrorMessage(err, "Unexpected error");
}

function safeNumber(v, fallback = null) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function statusToBadge(status, blocked) {
  const explicitBlocked = Boolean(blocked) || String(status || "").toLowerCase() === "blocked";
  if (explicitBlocked) return { variant: "error", label: "Blocked" };

  const s = String(status || "").toLowerCase();
  if (s === "online") return { variant: "success", label: "Online" };
  if (s === "offline") return { variant: "warn", label: "Offline" };
  return { variant: "info", label: s ? s.replace(/^\w/, (c) => c.toUpperCase()) : "Unknown" };
}

function rssiToBadge(rssi) {
  if (rssi === null) return { variant: "info", label: "—" };
  if (rssi >= -60) return { variant: "success", label: `${rssi} dBm (Strong)` };
  if (rssi >= -75) return { variant: "warn", label: `${rssi} dBm (Fair)` };
  return { variant: "error", label: `${rssi} dBm (Weak)` };
}

/**
 * Normalize client shape from potentially different backend payloads.
 */
function normalizeClient(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  const id = String(c.id || c.mac || c.macAddress || "").trim();
  return {
    id,
    name: c.name || c.hostname || c.deviceName || "Unknown device",
    ip: c.ip || c.ipAddress || "—",
    ssid: c.ssid || c.networkId || c.ssidId || "",
    status: c.status || "unknown",
    rssi: typeof c.rssi === "number" ? c.rssi : safeNumber(c.rssi, null),
    lastSeen: c.lastSeen || c.last_seen || c.lastSeenAt || null,
    blocked:
      typeof c.blocked === "boolean"
        ? c.blocked
        : String(c.status || "").toLowerCase() === "blocked",
  };
}

function formatTimestamp(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

// PUBLIC_INTERFACE
function ClientDetailPage() {
  /** Client detail view showing device info and block/allow controls using existing API/mocks. */
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [networks, setNetworks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [busy, setBusy] = useState({ block: false });

  const didInitRef = useRef(false);

  const fetchAll = useCallback(async () => {
    const id = String(clientId || "");
    if (!id) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const [c, ns] = await Promise.all([
        clientsService.get(id),
        networksService.list().catch(() => []),
      ]);

      setClient(normalizeClient(c));
      setNetworks(Array.isArray(ns) ? ns : []);
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
      setClient(null);
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  if (!didInitRef.current) {
    didInitRef.current = true;
    // eslint-disable-next-line no-void
    void fetchAll();
  }

  const ssidLabel = useMemo(() => {
    const ssid = String(client?.ssid || "");
    if (!ssid) return "—";
    const match = (Array.isArray(networks) ? networks : []).find((n) => String(n?.id || "") === ssid);
    return match ? String(match?.name || ssid) : ssid;
  }, [client?.ssid, networks]);

  const badge = useMemo(() => statusToBadge(client?.status, client?.blocked), [client?.blocked, client?.status]);
  const rssi = useMemo(() => safeNumber(client?.rssi, null), [client?.rssi]);
  const rssiBadge = useMemo(() => rssiToBadge(rssi), [rssi]);

  const onToggleBlock = useCallback(async () => {
    if (!client) return;

    const id = String(client?.id || clientId || "");
    if (!id) return;

    setErrorMessage("");
    setBusy({ block: true });

    const currentlyBlocked = Boolean(client?.blocked) || String(client?.status || "").toLowerCase() === "blocked";
    const nextBlocked = !currentlyBlocked;

    const snapshot = { blocked: client?.blocked, status: client?.status };
    setClient((prev) =>
      prev ? { ...prev, blocked: nextBlocked, status: nextBlocked ? "blocked" : prev.status || "online" } : prev
    );

    try {
      await clientsService.update(id, { blocked: nextBlocked, status: nextBlocked ? "blocked" : "online" });
    } catch (e) {
      // rollback
      setClient((prev) => (prev ? { ...prev, ...snapshot } : prev));
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setBusy({ block: false });
    }
  }, [client, clientId]);

  return (
    <Card as="section">
      <h1 className="page-title">Client Details</h1>
      <p className="page-subtitle">
        Device: <strong className="mono">{clientId}</strong>
      </p>

      {errorMessage ? <ErrorBanner title="Client failed to load" message={errorMessage} onRetry={fetchAll} /> : null}

      {loading ? (
        <Card flat style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, marginBottom: 10 }}>
            Loading client…
          </div>
          <LoadingSkeleton lines={7} />
        </Card>
      ) : !client ? (
        <Card flat style={{ marginTop: 12 }}>
          <EmptyState
            title="Client not found"
            description="The selected client could not be loaded. It may have disconnected or been removed."
            icon="C"
            actionLabel="Back to Clients"
            onAction={() => navigate("/clients")}
          />
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant="info">Live</Badge>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
              SSID: <strong>{ssidLabel}</strong>
            </span>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              marginTop: 12,
              alignItems: "start",
            }}
          >
            <Card flat>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Device Info</div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Name</div>
                  <div style={{ fontWeight: 950 }}>{client?.name || "—"}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>MAC</div>
                    <div className="mono" style={{ fontWeight: 900, color: "var(--muted)" }}>
                      {client?.id || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>IP</div>
                    <div style={{ fontWeight: 900, color: "var(--muted)" }}>{client?.ip || "—"}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>SSID</div>
                    <div style={{ fontWeight: 900, color: "var(--muted)" }}>{ssidLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Last seen</div>
                    <div style={{ fontWeight: 900, color: "var(--muted)" }}>{formatTimestamp(client?.lastSeen)}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card flat>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Signal</div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>RSSI</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge variant={rssiBadge.variant}>{rssiBadge.label}</Badge>
                  </div>
                </div>

                <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                  RSSI is reported in dBm (closer to 0 is stronger). Values may be unavailable when the client is offline.
                </div>
              </div>
            </Card>

            <Card flat>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Controls</div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant={client?.blocked ? "primary" : "secondary"}
                  loading={busy.block}
                  onClick={onToggleBlock}
                  title="Optimistic update; rolls back on error"
                  aria-label={`${client?.blocked ? "Allow" : "Block"} client ${client?.name || client?.id || clientId}`}
                >
                  {client?.blocked ? "Allow" : "Block"}
                </Button>

                <Button variant="ghost" loading={loading} onClick={fetchAll}>
                  Refresh
                </Button>
              </div>

              <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                Blocking prevents this device from connecting (behavior depends on backend/controller support).
              </div>
            </Card>
          </div>
        </>
      )}

      <div style={{ marginTop: 14 }}>
        <Link to="/clients" style={{ color: "var(--primary)", fontWeight: 800 }}>
          ← Back to Clients
        </Link>
      </div>
    </Card>
  );
}

export default ClientDetailPage;
