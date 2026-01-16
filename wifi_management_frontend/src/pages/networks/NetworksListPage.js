import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { networksService } from "../../api";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
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

function statusToBadge(status) {
  const s = String(status || "").toLowerCase();
  const enabled = s === "active" || s === "enabled" || s === "up" || s === "online";
  return enabled
    ? { variant: "success", label: "Enabled" }
    : { variant: "warn", label: "Disabled" };
}

function isEnabledStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "active" || s === "enabled" || s === "up" || s === "online";
}

function toComparable(v) {
  if (v === null || typeof v === "undefined") return "";
  return String(v);
}

function applySort(rows, sortState) {
  const { key, direction } = sortState || {};
  if (!key) return rows;

  const next = [...rows];
  next.sort((a, b) => {
    const av = toComparable(a?.[key]);
    const bv = toComparable(b?.[key]);

    // Stable-ish string sort, but treat numbers when possible
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

// PUBLIC_INTERFACE
function NetworksListPage() {
  /** Networks list view: searchable/sortable table with actions and optimistic enable/disable. */
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [query, setQuery] = useState("");
  const [sortState, setSortState] = useState({ key: "name", direction: "asc" });

  // Busy map for per-row operations (toggle/delete)
  const [rowBusy, setRowBusy] = useState({}); // { [id]: { toggle?: bool, delete?: bool } }

  // Dialog state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    tone: "danger",
    onConfirm: null,
  });

  // One-time initial load. We avoid useEffect to keep this file self-contained and predictable:
  // it triggers once on first render using a ref.
  const didInitRef = useRef(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await networksService.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMessage(normalizeApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  if (!didInitRef.current) {
    didInitRef.current = true;
    // Fire-and-forget; internal state handles UI updates.
    // eslint-disable-next-line no-void
    void fetchList();
  }

  const onSort = useCallback((key) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }, []);

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return items;

    return items.filter((n) => {
      const hay = [
        n?.name,
        n?.id,
        n?.band,
        n?.security,
        n?.status,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [items, query]);

  const rows = useMemo(() => applySort(filtered, sortState), [filtered, sortState]);

  const setBusy = useCallback((id, patch) => {
    setRowBusy((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const updateNetworkLocally = useCallback((id, patch) => {
    setItems((prev) => prev.map((n) => (n?.id === id ? { ...n, ...patch } : n)));
  }, []);

  const removeNetworkLocally = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n?.id !== id));
  }, []);

  const openConfirm = useCallback(
    ({ title, description, confirmLabel, tone = "danger", onConfirm }) => {
      setConfirmState({
        open: true,
        title,
        description,
        confirmLabel: confirmLabel || "Confirm",
        tone,
        onConfirm,
      });
    },
    []
  );

  const closeConfirm = useCallback(() => {
    setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));
  }, []);

  const onToggleEnabled = useCallback(
    async (network) => {
      const id = String(network?.id || "");
      if (!id) return;

      const currentlyEnabled = isEnabledStatus(network?.status);
      const nextEnabled = !currentlyEnabled;

      const nextStatus = nextEnabled ? "active" : "disabled";

      setErrorMessage("");
      setBusy(id, { toggle: true });

      // Optimistic update (immediate UI feedback)
      updateNetworkLocally(id, { status: nextStatus });

      try {
        // Existing service supports update(id, payload). Keep payload minimal and generic.
        await networksService.update(id, { status: nextStatus });
      } catch (e) {
        // Rollback on failure
        updateNetworkLocally(id, { status: network?.status });
        setErrorMessage(normalizeApiErrorMessage(e));
      } finally {
        setBusy(id, { toggle: false });
      }
    },
    [setBusy, updateNetworkLocally]
  );

  const onDelete = useCallback(
    (network) => {
      const id = String(network?.id || "");
      if (!id) return;

      openConfirm({
        title: "Delete network?",
        description: `This will permanently delete "${network?.name || id}".`,
        confirmLabel: "Delete",
        tone: "danger",
        onConfirm: async () => {
          closeConfirm();
          setErrorMessage("");
          setBusy(id, { delete: true });

          // Optimistically remove row.
          const snapshot = items;
          removeNetworkLocally(id);

          try {
            await networksService.remove(id);
          } catch (e) {
            // Rollback list
            setItems(snapshot);
            setErrorMessage(normalizeApiErrorMessage(e));
          } finally {
            setBusy(id, { delete: false });
          }
        },
      });
    },
    [closeConfirm, items, openConfirm, removeNetworkLocally, setBusy]
  );

  const onEdit = useCallback(
    (network) => {
      // Route is already implemented; "edit" currently uses the detail page, which contains editable fields/tabs.
      const id = String(network?.id || "");
      if (!id) return;
      navigate(`/networks/${encodeURIComponent(id)}`, { replace: false });
    },
    [navigate]
  );

  const showEmpty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  return (
    <Card as="section">
      <h1 className="page-title">Networks</h1>
      <p className="page-subtitle">
        Manage SSIDs, security settings, and radio configuration. Data is loaded from the existing API service
        (or deterministic mocks when <span className="mono">useMocks</span> is enabled).
      </p>

      {errorMessage ? (
        <ErrorBanner title="Networks failed to load" message={errorMessage} onRetry={fetchList} />
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <FormField
            label="Search"
            help="Search by name, ID (SSID key), band, security, or status."
          >
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. guest, WPA2, 5GHz…"
            />
          </FormField>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="ghost" loading={loading} onClick={fetchList}>
            Refresh
          </Button>
          <Button variant="primary" disabled title="Creation flow will be added later">
            Add Network (soon)
          </Button>
        </div>
      </div>

      <Card flat style={{ padding: 0, marginTop: 12 }}>
        {loading ? (
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, marginBottom: 10 }}>
              Loading networks…
            </div>
            <LoadingSkeleton lines={6} />
          </div>
        ) : showEmpty ? (
          <div style={{ padding: 14 }}>
            <EmptyState
              title={items.length === 0 ? "No networks found" : "No results"}
              description={
                items.length === 0
                  ? "No networks were returned from the service. Try refreshing or enable mocks."
                  : "Try adjusting your search query."
              }
              icon="N"
              actionLabel={items.length === 0 ? "Refresh" : "Clear search"}
              onAction={items.length === 0 ? fetchList : () => setQuery("")}
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
                  <SortableTh sortKey="status" sortState={sortState} onSort={onSort}>
                    Status
                  </SortableTh>
                  <th scope="col" style={{ width: 300 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => {
                  const id = String(n?.id || "");
                  const busy = rowBusy[id] || {};
                  const badge = statusToBadge(n?.status);

                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 900 }}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <span>{n?.name || id}</span>
                          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                            {id}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontWeight: 700 }}>{n?.band || "—"}</td>
                      <td style={{ color: "var(--muted)", fontWeight: 700 }}>{n?.security || "—"}</td>
                      <td>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <Link
                            to={`/networks/${encodeURIComponent(id)}`}
                            style={{ color: "var(--primary)", fontWeight: 900 }}
                          >
                            View
                          </Link>

                          <Button variant="ghost" onClick={() => onEdit(n)} disabled={busy.delete || busy.toggle}>
                            Edit
                          </Button>

                          <Button
                            variant="secondary"
                            loading={Boolean(busy.toggle)}
                            disabled={Boolean(busy.delete)}
                            onClick={() => onToggleEnabled(n)}
                            title="Optimistic update; rolls back on error"
                          >
                            {isEnabledStatus(n?.status) ? "Disable" : "Enable"}
                          </Button>

                          <Button
                            variant="ghost"
                            loading={Boolean(busy.delete)}
                            disabled={Boolean(busy.toggle)}
                            onClick={() => onDelete(n)}
                          >
                            Delete
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

export default NetworksListPage;
