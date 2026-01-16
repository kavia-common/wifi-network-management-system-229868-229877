import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientsService, healthService, networksService } from "../api";
import { Badge, Button, Card, ErrorBanner, LoadingSkeleton, getAriaErrorMessage } from "../components/ui";

/**
 * Dashboard view:
 * - Shows overall system health (from healthService)
 * - Shows key metrics (from list endpoints)
 * - Provides quick actions (optimistic UI, backed by mocks or real API)
 */

function normalizeApiErrorMessage(err) {
  return getAriaErrorMessage(err, "Unexpected error");
}

function coerceStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (!s) return "Unknown";
  if (s === "ok" || s === "healthy" || s === "online") return "Healthy";
  if (s === "degraded" || s === "warn" || s === "warning") return "Degraded";
  if (s === "down" || s === "error" || s === "critical") return "Offline";
  return s.replace(/^\w/, (c) => c.toUpperCase());
}

function statusToBadgeVariant(status) {
  const s = String(status || "").toLowerCase();
  if (s === "ok" || s === "healthy" || s === "online") return "success";
  if (s === "degraded" || s === "warn" || s === "warning") return "warn";
  if (s === "down" || s === "error" || s === "critical") return "error";
  return "info";
}

function countActiveNetworks(networks) {
  if (!Array.isArray(networks)) return 0;
  return networks.filter((n) => {
    const v = String(n?.status || "").toLowerCase();
    // allow flexible backend payloads: "active"|"enabled"|"up"
    return v === "active" || v === "enabled" || v === "up" || v === "online";
  }).length;
}

function countConnectedClients(clients) {
  if (!Array.isArray(clients)) return 0;
  return clients.filter((c) => String(c?.status || "").toLowerCase() === "online").length;
}

function deriveAlertsCount({ health, networks, clients }) {
  // There is no dedicated alerts endpoint yet, so we derive a useful value:
  // - +1 for any non-ok service health
  // - +1 if any network is inactive
  // - +1 if any client is offline
  let count = 0;

  const healthStatus = String(health?.status || "").toLowerCase();
  if (healthStatus && healthStatus !== "ok" && healthStatus !== "healthy") count += 1;

  const services = health?.services && typeof health.services === "object" ? health.services : null;
  if (services) {
    const anyBad = Object.values(services).some((v) => {
      const sv = String(v || "").toLowerCase();
      return sv && sv !== "ok" && sv !== "healthy";
    });
    if (anyBad) count += 1;
  }

  if (Array.isArray(networks)) {
    const anyInactive = networks.some((n) => countActiveNetworks([n]) === 0);
    if (anyInactive && networks.length > 0) count += 1;
  }

  if (Array.isArray(clients)) {
    const anyOffline = clients.some((c) => String(c?.status || "").toLowerCase() === "offline");
    if (anyOffline && clients.length > 0) count += 1;
  }

  return count;
}

// PUBLIC_INTERFACE
function DashboardPage() {
  /** Dashboard page showing health summary, metrics and quick actions. */
  const navigate = useNavigate();

  const [health, setHealth] = useState(null);
  const [networks, setNetworks] = useState(null);
  const [clients, setClients] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Quick actions (optimistic UI)
  const [actionBusy, setActionBusy] = useState({
    addNetwork: false,
    rescan: false,
    restartAp: false,
  });
  const [actionMessage, setActionMessage] = useState("");

  const lastActionTimerRef = useRef(null);

  const clearActionMessageLater = useCallback(() => {
    if (lastActionTimerRef.current) window.clearTimeout(lastActionTimerRef.current);
    lastActionTimerRef.current = window.setTimeout(() => setActionMessage(""), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [h, ns, cs] = await Promise.all([
        // Some backends may prefer getHealth vs getStatus; mocks provide both.
        healthService.getHealth(),
        networksService.list(),
        clientsService.list(),
      ]);

      setHealth(h || null);
      setNetworks(Array.isArray(ns) ? ns : []);
      setClients(Array.isArray(cs) ? cs : []);
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
      // Keep any previous data rather than blanking the dashboard.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    return () => {
      if (lastActionTimerRef.current) window.clearTimeout(lastActionTimerRef.current);
    };
  }, [fetchAll]);

  const statusSummary = useMemo(() => {
    const raw = health?.status || "";
    const label = coerceStatusLabel(raw);
    const variant = statusToBadgeVariant(raw);

    // Helpful subtitle: show service rollup if present
    const services = health?.services && typeof health.services === "object" ? health.services : null;
    const degradedServices = services
      ? Object.entries(services)
          .filter(([, v]) => {
            const sv = String(v || "").toLowerCase();
            return sv && sv !== "ok" && sv !== "healthy";
          })
          .map(([k]) => k)
      : [];

    return {
      raw,
      label,
      variant,
      degradedServices,
      timestamp: health?.timestamp || null,
    };
  }, [health]);

  const metrics = useMemo(() => {
    const totalNetworks = Array.isArray(networks) ? networks.length : 0;
    const activeNetworks = countActiveNetworks(networks);
    const totalClients = Array.isArray(clients) ? clients.length : 0;
    const connectedClients = countConnectedClients(clients);

    const alerts = deriveAlertsCount({ health, networks, clients });

    return {
      totalNetworks,
      activeNetworks,
      totalClients,
      connectedClients,
      alerts,
    };
  }, [clients, health, networks]);

  const onAddNetwork = useCallback(async () => {
    setActionBusy((s) => ({ ...s, addNetwork: true }));
    setActionMessage("");
    setErrorMessage("");

    // Optimistically reflect something immediately: we add through service, then refresh.
    const name = `New Network ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    try {
      const created = await networksService.create({
        name,
        band: "Dual-band",
        security: "WPA2",
        status: "active",
      });

      setActionMessage(`Network "${created?.name || name}" added.`);
      clearActionMessageLater();

      // Refresh metrics so counts update.
      await fetchAll();

      // Optional "nice" behavior: take user to networks page after creation.
      // We do it only after refresh so list state is consistent.
      navigate("/networks");
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setActionBusy((s) => ({ ...s, addNetwork: false }));
    }
  }, [clearActionMessageLater, fetchAll, navigate]);

  const onRescan = useCallback(async () => {
    setActionBusy((s) => ({ ...s, rescan: true }));
    setActionMessage("");
    setErrorMessage("");

    try {
      // There is no dedicated "rescan" endpoint in the existing services,
      // so we simulate a rescan by re-fetching data (works for both real API + mocks).
      await fetchAll();
      setActionMessage("Rescan complete. Data refreshed.");
      clearActionMessageLater();
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setActionBusy((s) => ({ ...s, rescan: false }));
    }
  }, [clearActionMessageLater, fetchAll]);

  const onRestartAp = useCallback(async () => {
    setActionBusy((s) => ({ ...s, restartAp: true }));
    setActionMessage("");
    setErrorMessage("");

    try {
      // No backend endpoint exists yet; we implement "optimistic" restart:
      // - show immediate status message
      // - refresh health after a brief delay (mocks will sometimes flip to degraded)
      setActionMessage("Restarting access point…");
      clearActionMessageLater();

      await new Promise((resolve) => window.setTimeout(resolve, 650));
      await fetchAll();

      setActionMessage("Access point restarted (simulated).");
      clearActionMessageLater();
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setActionBusy((s) => ({ ...s, restartAp: false }));
    }
  }, [clearActionMessageLater, fetchAll]);

  const showEmpty = useMemo(() => {
    if (loading) return false;
    const noNetworks = Array.isArray(networks) && networks.length === 0;
    const noClients = Array.isArray(clients) && clients.length === 0;
    return noNetworks && noClients;
  }, [clients, loading, networks]);

  return (
    <section className="stack" aria-label="Dashboard">
      <Card as="section">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Real-time overview of WiFi health, core metrics, and quick actions.
        </p>

        {errorMessage ? (
          <ErrorBanner
            title="Dashboard failed to load"
            message={errorMessage}
            onRetry={fetchAll}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant={statusSummary.variant}>
              System: {statusSummary.label}
            </Badge>

            {statusSummary.degradedServices.length ? (
              <Badge variant="warn" title="Degraded services">
                Services: {statusSummary.degradedServices.join(", ")}
              </Badge>
            ) : null}

            {statusSummary.timestamp ? (
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                Updated: {new Date(statusSummary.timestamp).toLocaleString()}
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="ghost" loading={loading} onClick={fetchAll}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "start",
        }}
      >
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Total Networks</div>
          {loading ? (
            <LoadingSkeleton lines={2} />
          ) : (
            <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{metrics.totalNetworks}</div>
          )}
          {!loading ? (
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              Active: <strong>{metrics.activeNetworks}</strong>
            </div>
          ) : null}
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Connected Clients</div>
          {loading ? (
            <LoadingSkeleton lines={2} />
          ) : (
            <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{metrics.connectedClients}</div>
          )}
          {!loading ? (
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              Total seen: <strong>{metrics.totalClients}</strong>
            </div>
          ) : null}
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Alerts</div>
          {loading ? (
            <LoadingSkeleton lines={2} />
          ) : (
            <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{metrics.alerts}</div>
          )}
          {!loading ? (
            <div style={{ marginTop: 8 }}>
              <Badge variant={metrics.alerts > 0 ? "warn" : "success"}>
                {metrics.alerts > 0 ? "Attention recommended" : "All clear"}
              </Badge>
            </div>
          ) : null}
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Quick Actions</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <Button
              variant="primary"
              loading={actionBusy.addNetwork}
              onClick={onAddNetwork}
              aria-label="Add a new network"
            >
              Add Network
            </Button>

            <Button
              variant="ghost"
              loading={actionBusy.rescan}
              onClick={onRescan}
              aria-label="Rescan and refresh dashboard data"
            >
              Rescan / Refresh Data
            </Button>

            <Button
              variant="secondary"
              loading={actionBusy.restartAp}
              onClick={onRestartAp}
              aria-label="Restart access point (simulated)"
            >
              Restart AP
            </Button>
          </div>

          {actionMessage ? (
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              <strong>Action:</strong> {actionMessage}
            </div>
          ) : null}
        </Card>
      </div>

      {loading ? (
        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, marginBottom: 10 }}>
            Loading details…
          </div>
          <LoadingSkeleton lines={6} />
        </Card>
      ) : null}

      {!loading && showEmpty ? (
        <Card flat>
          <div style={{ fontWeight: 900, letterSpacing: "-0.01em" }}>No data yet</div>
          <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)", lineHeight: 1.55 }}>
            No networks or clients were returned. Try refreshing, or add a network to get started.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={onAddNetwork} loading={actionBusy.addNetwork}>
              Add Network
            </Button>
            <Button variant="ghost" onClick={fetchAll}>
              Refresh
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

export default DashboardPage;
