import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsService, networksService } from "../../api";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  FormField,
  LoadingSkeleton,
  Table,
  TableWrap,
  VisuallyHidden,
  getAriaErrorMessage,
} from "../../components/ui";

function normalizeApiErrorMessage(err) {
  return getAriaErrorMessage(err, "Unexpected error");
}

function isEnabledStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "active" || s === "enabled" || s === "up" || s === "online";
}

function statusToBadge(status) {
  const enabled = isEnabledStatus(status);
  return enabled
    ? { variant: "success", label: "Enabled" }
    : { variant: "warn", label: "Disabled" };
}

function clientStatusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return { variant: "success", label: "Online" };
  if (s === "offline") return { variant: "warn", label: "Offline" };
  return { variant: "info", label: s ? s.replace(/^\w/, (c) => c.toUpperCase()) : "Unknown" };
}

function safeNumber(v, fallback = null) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "security", label: "Security" },
  { key: "band", label: "Band / Channel" },
  { key: "clients", label: "Connected Clients" },
];

// PUBLIC_INTERFACE
function NetworkDetailPage() {
  /** Network detail view with tabs/sections and actions (enable/disable, delete) wired to existing services. */
  const { networkId } = useParams();
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  // Local editable fields (until a dedicated update form is added)
  const [editableName, setEditableName] = useState("");
  const [editableBand, setEditableBand] = useState("");
  const [editableSecurity, setEditableSecurity] = useState("");
  const [editableChannel, setEditableChannel] = useState("Auto");

  const [busy, setBusy] = useState({ toggle: false, delete: false });

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    tone: "danger",
    onConfirm: null,
  });

  const didInitRef = useRef(false);

  const fetchAll = useCallback(async () => {
    const id = String(networkId || "");
    if (!id) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const [n, cs] = await Promise.all([networksService.get(id), clientsService.list()]);

      const resolvedNetwork = n || null;
      setNetwork(resolvedNetwork);

      const allClients = Array.isArray(cs) ? cs : [];
      setClients(allClients.filter((c) => String(c?.networkId || "") === id));

      // Seed the editable fields from the fetched network.
      setEditableName(String(resolvedNetwork?.name || id));
      setEditableBand(String(resolvedNetwork?.band || "Dual-band"));
      setEditableSecurity(String(resolvedNetwork?.security || "WPA2"));

      // Channel is not part of the current mock network shape; keep it in UI as a planned setting.
      setEditableChannel("Auto");
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
      setNetwork(null);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  if (!didInitRef.current) {
    didInitRef.current = true;
    // eslint-disable-next-line no-void
    void fetchAll();
  }

  const badge = useMemo(() => statusToBadge(network?.status), [network?.status]);

  const connectedSummary = useMemo(() => {
    const total = clients.length;
    const online = clients.filter((c) => String(c?.status || "").toLowerCase() === "online").length;
    return { total, online };
  }, [clients]);

  const openConfirm = useCallback(({ title, description, confirmLabel, tone = "danger", onConfirm }) => {
    setConfirmState({
      open: true,
      title,
      description,
      confirmLabel: confirmLabel || "Confirm",
      tone,
      onConfirm,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));
  }, []);

  const onToggleEnabled = useCallback(async () => {
    if (!network) return;

    const id = String(network?.id || networkId || "");
    if (!id) return;

    setErrorMessage("");
    setBusy((s) => ({ ...s, toggle: true }));

    const previousStatus = network?.status;
    const nextStatus = isEnabledStatus(previousStatus) ? "disabled" : "active";

    // Optimistic update
    setNetwork((prev) => (prev ? { ...prev, status: nextStatus } : prev));

    try {
      await networksService.update(id, { status: nextStatus });
    } catch (e) {
      // rollback
      setNetwork((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setBusy((s) => ({ ...s, toggle: false }));
    }
  }, [network, networkId]);

  const onDelete = useCallback(() => {
    if (!network) return;

    const id = String(network?.id || networkId || "");
    if (!id) return;

    openConfirm({
      title: "Delete network?",
      description: `This will permanently delete "${network?.name || id}".`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        closeConfirm();
        setErrorMessage("");
        setBusy((s) => ({ ...s, delete: true }));

        try {
          await networksService.remove(id);
          navigate("/networks");
        } catch (e) {
          setErrorMessage(normalizeApiErrorMessage(e));
        } finally {
          setBusy((s) => ({ ...s, delete: false }));
        }
      },
    });
  }, [closeConfirm, navigate, network, networkId, openConfirm]);

  const tabNav = (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 10,
        marginTop: 10,
      }}
      aria-label="Network detail tabs"
    >
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <Button
            key={t.key}
            variant={active ? "primary" : "ghost"}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </Button>
        );
      })}
    </div>
  );

  const overviewPane = (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 12 }}>
      <Card flat>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Status</div>
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="mono" style={{ color: "var(--muted)", fontWeight: 800 }}>
            {String(network?.id || networkId || "")}
          </span>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" loading={busy.toggle} disabled={busy.delete} onClick={onToggleEnabled}>
            {isEnabledStatus(network?.status) ? "Disable" : "Enable"}
          </Button>
          <Button variant="ghost" loading={busy.delete} disabled={busy.toggle} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Card>

      <Card flat>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Configuration</div>
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div>
            <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 900 }}>SSID Name</span>
            <div style={{ fontWeight: 900 }}>{network?.name || "—"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 900 }}>Band</span>
              <div style={{ fontWeight: 800, color: "var(--muted)" }}>{network?.band || "—"}</div>
            </div>
            <div>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 900 }}>Security</span>
              <div style={{ fontWeight: 800, color: "var(--muted)" }}>{network?.security || "—"}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card flat>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Connected Clients</div>
        <div style={{ marginTop: 10, fontSize: 26, fontWeight: 950 }}>
          {connectedSummary.online}
        </div>
        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
          Total on this network: <strong>{connectedSummary.total}</strong>
        </div>
        <div style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setActiveTab("clients")}>
            View clients
          </Button>
        </div>
      </Card>
    </div>
  );

  const securityPane = (
    <div style={{ marginTop: 12 }}>
      <Card flat>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Security</div>
        <p style={{ marginTop: 8, marginBottom: 0, color: "var(--muted)", lineHeight: 1.55 }}>
          These fields are displayed from the current network object and provide a safe place to extend later with
          password rotation, WPA modes, and isolation toggles.
        </p>

        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <FormField label="Security Mode" help="Read/write UI placeholder; persistence will be added later.">
            <select
              className="select"
              value={editableSecurity}
              onChange={(e) => setEditableSecurity(e.target.value)}
            >
              <option value="WPA2">WPA2</option>
              <option value="WPA3">WPA3</option>
              <option value="Open">Open</option>
            </select>
          </FormField>

          <FormField label="Client isolation" help="Planned setting (not persisted).">
            <select className="select" defaultValue="Off">
              <option>Off</option>
              <option>On</option>
            </select>
          </FormField>

          <FormField label="Key rotation" help="Planned setting (not persisted).">
            <select className="select" defaultValue="Disabled">
              <option>Disabled</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </FormField>

          <FormField label="Notes" help="Local notes (not persisted).">
            <textarea className="textarea" rows={3} placeholder="Optional notes…" />
          </FormField>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="primary" disabled title="Save flow will be added with backend spec">
            Save (soon)
          </Button>
          <Button variant="ghost" onClick={() => setEditableSecurity(String(network?.security || "WPA2"))}>
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );

  const bandPane = (
    <div style={{ marginTop: 12 }}>
      <Card flat>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Band / Channel</div>
        <p style={{ marginTop: 8, marginBottom: 0, color: "var(--muted)", lineHeight: 1.55 }}>
          Band is loaded from the network record; channel controls are presented as a planned UI surface.
        </p>

        <div className="form-grid cols-2" style={{ marginTop: 12 }}>
          <FormField label="Band" help="Read/write UI placeholder; persistence will be added later.">
            <select className="select" value={editableBand} onChange={(e) => setEditableBand(e.target.value)}>
              <option value="Dual-band">Dual-band</option>
              <option value="2.4GHz">2.4GHz</option>
              <option value="5GHz">5GHz</option>
            </select>
          </FormField>

          <FormField label="Channel" help="Planned setting (not persisted).">
            <select className="select" value={editableChannel} onChange={(e) => setEditableChannel(e.target.value)}>
              <option value="Auto">Auto</option>
              <option value="1">1</option>
              <option value="6">6</option>
              <option value="11">11</option>
              <option value="36">36</option>
              <option value="44">44</option>
              <option value="149">149</option>
            </select>
          </FormField>

          <FormField label="SSID name" help="Local edit only (not persisted yet).">
            <input className="input" value={editableName} onChange={(e) => setEditableName(e.target.value)} />
          </FormField>

          <FormField label="Transmit power" help="Planned setting (not persisted).">
            <select className="select" defaultValue="Auto">
              <option>Auto</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </FormField>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="primary" disabled title="Save flow will be added with backend spec">
            Save (soon)
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditableName(String(network?.name || networkId || ""));
              setEditableBand(String(network?.band || "Dual-band"));
              setEditableSecurity(String(network?.security || "WPA2"));
              setEditableChannel("Auto");
            }}
          >
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );

  const clientsPane = (
    <div style={{ marginTop: 12 }}>
      <Card flat style={{ padding: 0 }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Clients on this network</div>
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                Online: <strong>{connectedSummary.online}</strong> / {connectedSummary.total}
              </div>
            </div>
            <Button variant="ghost" loading={loading} onClick={fetchAll}>
              Refresh
            </Button>
          </div>
        </div>

        {clients.length === 0 ? (
          <div style={{ padding: 14 }}>
            <EmptyState
              title="No clients connected"
              description="When devices connect to this SSID, they will appear here."
              icon="C"
              actionLabel="Refresh"
              onAction={fetchAll}
            />
          </div>
        ) : (
          <TableWrap>
            <Table aria-label="Connected clients table">
              <caption>
                <VisuallyHidden>Clients connected to this network</VisuallyHidden>
              </caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">MAC</th>
                  <th scope="col">IP</th>
                  <th scope="col">RSSI</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const badgeInfo = clientStatusBadge(c?.status);
                  const rssi = safeNumber(c?.rssi, null);

                  return (
                    <tr key={String(c?.id || "")}>
                      <td style={{ fontWeight: 900 }}>{c?.name || "Unknown device"}</td>
                      <td className="mono" style={{ color: "var(--muted)" }}>
                        {c?.id || "—"}
                      </td>
                      <td style={{ color: "var(--muted)" }}>{c?.ip || "—"}</td>
                      <td className="mono" style={{ color: "var(--muted)" }}>
                        {rssi === null ? "—" : `${rssi} dBm`}
                      </td>
                      <td>
                        <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );

  const pane = useMemo(() => {
    if (activeTab === "security") return securityPane;
    if (activeTab === "band") return bandPane;
    if (activeTab === "clients") return clientsPane;
    return overviewPane;
  }, [activeTab, bandPane, clientsPane, overviewPane, securityPane]);

  return (
    <Card as="section">
      <h1 className="page-title">Network Details</h1>

      <p className="page-subtitle">
        Network ID: <strong>{networkId}</strong>{" "}
        {!loading && network ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
      </p>

      {errorMessage ? (
        <ErrorBanner title="Network failed to load" message={errorMessage} onRetry={fetchAll} />
      ) : null}

      {loading ? (
        <Card flat style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, marginBottom: 10 }}>
            Loading network…
          </div>
          <LoadingSkeleton lines={7} />
        </Card>
      ) : !network ? (
        <Card flat style={{ marginTop: 12 }}>
          <EmptyState
            title="Network not found"
            description="The selected network could not be loaded. It may have been deleted."
            icon="N"
            actionLabel="Back to Networks"
            onAction={() => navigate("/networks")}
          />
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant="info">Live</Badge>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
              Band: <strong>{network?.band || "—"}</strong> • Security:{" "}
              <strong>{network?.security || "—"}</strong>
            </span>
          </div>

          {tabNav}
          {pane}
        </>
      )}

      <div style={{ marginTop: 14 }}>
        <Link to="/networks" style={{ color: "var(--primary)", fontWeight: 800 }}>
          ← Back to Networks
        </Link>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel="Cancel"
        tone={confirmState.tone}
        onCancel={closeConfirm}
        onConfirm={confirmState.onConfirm || closeConfirm}
      />
    </Card>
  );
}

export default NetworkDetailPage;
