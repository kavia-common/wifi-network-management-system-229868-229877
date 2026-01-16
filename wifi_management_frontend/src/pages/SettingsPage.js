import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, EmptyState, ErrorBanner, FormField, LoadingSkeleton } from "../components/ui";
import { settingsService } from "../api";
import { getFeatureFlags, isFeatureEnabled } from "../utils/featureFlags";

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off"].includes(v)) return false;
  }
  return fallback;
}

function toInt(value, fallback) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseCsvList(value) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFeatureFlagsAllowingEmpty(rawFlags) {
  // If REACT_APP_FEATURE_FLAGS is unset/empty, featureFlags.js returns {},
  // but we still want to show a user-friendly placeholder string in UI.
  const raw = rawFlags ?? "";
  const flags = getFeatureFlags();
  return { raw, flags };
}

// PUBLIC_INTERFACE
function SettingsPage() {
  /** Settings page for global WiFi parameters and UI/integration preferences (in-memory only). */
  const env = useMemo(() => {
    const apiBase = process.env.REACT_APP_API_BASE || "";
    const wsUrl = process.env.REACT_APP_WS_URL || "";
    const rawFeatureFlags = process.env.REACT_APP_FEATURE_FLAGS || "";
    const { raw, flags } = parseFeatureFlagsAllowingEmpty(rawFeatureFlags);

    return {
      apiBase,
      wsUrl,
      rawFeatureFlags: raw,
      parsedFeatureFlags: flags,
    };
  }, []);

  const flagsSupportMocks = useMemo(() => {
    // We "support" mock mode only if the useMocks flag exists or experiments are enabled.
    // This avoids presenting a toggle that can't do anything in environments without flags.
    const flags = env.parsedFeatureFlags || {};
    const hasUseMocksFlag = Object.prototype.hasOwnProperty.call(flags, "useMocks");
    const experimentsEnabled = toBool(process.env.REACT_APP_EXPERIMENTS_ENABLED, false);

    return hasUseMocksFlag || experimentsEnabled;
  }, [env.parsedFeatureFlags]);

  const useMocksEnabled = useMemo(() => isFeatureEnabled("useMocks", false), []);

  const [status, setStatus] = useState({ loading: true, error: null });
  const [serverSettings, setServerSettings] = useState(null);

  // In-memory app preferences (no backend persistence yet)
  const [prefs, setPrefs] = useState(null);

  // Field-level errors (validation)
  const [errors, setErrors] = useState({});

  // Form save feedback
  const [saveState, setSaveState] = useState({ saving: false, savedAt: null, error: null });

  const lastLoadedRef = useRef(null);

  const defaults = useMemo(() => {
    // Env-driven defaults where applicable. These are only defaults for the in-memory form state.
    // Actual system settings may come from settingsService.get() (mock/real).
    return {
      wifi: {
        region: "US",
        channels2g: [1, 6, 11],
        channels5g: [36, 40, 44, 48],
        autoOptimizationEnabled: true,
        bandSteeringEnabled: false,
        txPowerDbm: 20,
      },
      ui: {
        denseTables: false,
        showAdvanced: false,
      },
      integrations: {
        apiBase: env.apiBase || "(unset)",
        wsUrl: env.wsUrl || "(unset)",
      },
      featureFlags: {
        raw: env.rawFeatureFlags || "",
        parsed: env.parsedFeatureFlags || {},
      },
      dev: {
        useMocks: useMocksEnabled,
      },
    };
  }, [env.apiBase, env.parsedFeatureFlags, env.rawFeatureFlags, env.wsUrl, useMocksEnabled]);

  const hydrateFromServer = useCallback(
    (remote) => {
      // Remote settings shape is not yet standardized; best-effort normalization.
      const r = remote && typeof remote === "object" ? remote : {};
      const wifi = r.wifi && typeof r.wifi === "object" ? r.wifi : r;

      const normalized = {
        wifi: {
          region: String(wifi.region || defaults.wifi.region),
          channels2g: Array.isArray(wifi.channels2g)
            ? wifi.channels2g.map((n) => toInt(n, 1)).filter(Boolean)
            : defaults.wifi.channels2g,
          channels5g: Array.isArray(wifi.channels5g)
            ? wifi.channels5g.map((n) => toInt(n, 36)).filter(Boolean)
            : defaults.wifi.channels5g,
          autoOptimizationEnabled: toBool(
            wifi.autoOptimizationEnabled ?? wifi.autoOptimization ?? defaults.wifi.autoOptimizationEnabled,
            defaults.wifi.autoOptimizationEnabled
          ),
          bandSteeringEnabled: toBool(wifi.bandSteeringEnabled ?? defaults.wifi.bandSteeringEnabled, defaults.wifi.bandSteeringEnabled),
          txPowerDbm: toInt(wifi.txPowerDbm ?? defaults.wifi.txPowerDbm, defaults.wifi.txPowerDbm),
        },
        ui: { ...defaults.ui },
        integrations: { ...defaults.integrations },
        featureFlags: { ...defaults.featureFlags },
        dev: { ...defaults.dev },
      };

      return normalized;
    },
    [defaults]
  );

  const validate = useCallback((candidate) => {
    const nextErrors = {};
    const region = String(candidate?.wifi?.region ?? "").trim().toUpperCase();
    const allowedRegions = ["US", "EU", "JP", "CN", "AU", "IN", "GB", "CA"];

    if (!region) nextErrors.region = "Region is required.";
    else if (!allowedRegions.includes(region)) {
      nextErrors.region = `Unsupported region. Allowed: ${allowedRegions.join(", ")}.`;
    }

    const c2 = candidate?.wifi?.channels2g;
    const c5 = candidate?.wifi?.channels5g;

    const allowed2g = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const allowed5g = new Set([36, 40, 44, 48, 149, 153, 157, 161, 165]);

    if (!Array.isArray(c2) || c2.length === 0) nextErrors.channels2g = "Provide at least one 2.4GHz channel.";
    else if (c2.some((n) => !allowed2g.has(Number(n)))) {
      nextErrors.channels2g = "2.4GHz channels must be within 1–11.";
    }

    if (!Array.isArray(c5) || c5.length === 0) nextErrors.channels5g = "Provide at least one 5GHz channel.";
    else if (c5.some((n) => !allowed5g.has(Number(n)))) {
      nextErrors.channels5g = `5GHz channels must be one of: ${Array.from(allowed5g).join(", ")}.`;
    }

    const tx = candidate?.wifi?.txPowerDbm;
    if (!Number.isFinite(Number(tx))) nextErrors.txPowerDbm = "TX power must be a number.";
    else if (Number(tx) < 1 || Number(tx) > 30) nextErrors.txPowerDbm = "TX power must be between 1 and 30 dBm.";

    return nextErrors;
  }, []);

  const load = useCallback(async () => {
    setStatus({ loading: true, error: null });
    setSaveState({ saving: false, savedAt: null, error: null });

    try {
      const data = await settingsService.get();
      lastLoadedRef.current = data;
      setServerSettings(data);

      const hydrated = hydrateFromServer(data);
      setPrefs(hydrated);
      setErrors(validate(hydrated));

      setStatus({ loading: false, error: null });
    } catch (e) {
      const msg = e?.message ? String(e.message) : "Failed to load settings.";
      setStatus({ loading: false, error: msg });
      setServerSettings(null);

      // We still allow editing defaults in-memory even when backend is unavailable.
      setPrefs(defaults);
      setErrors(validate(defaults));
    }
  }, [defaults, hydrateFromServer, validate]);

  useEffect(() => {
    load();
  }, [load]);

  const updateWifiField = useCallback((field, value) => {
    setPrefs((prev) => {
      const next = {
        ...(prev || defaults),
        wifi: {
          ...((prev || defaults).wifi || {}),
          [field]: value,
        },
      };
      setErrors(validate(next));
      return next;
    });
  }, [defaults, validate]);

  const updateUiField = useCallback((field, value) => {
    setPrefs((prev) => {
      const next = {
        ...(prev || defaults),
        ui: {
          ...((prev || defaults).ui || {}),
          [field]: value,
        },
      };
      setErrors(validate(next));
      return next;
    });
  }, [defaults, validate]);

  const onReset = useCallback(() => {
    const resetTo = serverSettings ? hydrateFromServer(serverSettings) : defaults;
    setPrefs(resetTo);
    setErrors(validate(resetTo));
    setSaveState({ saving: false, savedAt: null, error: null });
  }, [defaults, hydrateFromServer, serverSettings, validate]);

  const hasErrors = useMemo(() => Object.keys(errors || {}).length > 0, [errors]);

  const onSaveInMemory = useCallback(async () => {
    if (!prefs) return;

    const nextErrors = validate(prefs);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaveState({ saving: false, savedAt: null, error: "Please fix validation errors before saving." });
      return;
    }

    // In-memory "save" only, no backend persistence yet.
    setSaveState({ saving: true, savedAt: null, error: null });
    await new Promise((r) => setTimeout(r, 300));
    setSaveState({ saving: false, savedAt: new Date().toISOString(), error: null });
  }, [prefs, validate]);

  const onToggleMockMode = useCallback(() => {
    // Important: API selection happens at module init time (src/api/index.js).
    // We cannot truly toggle mocks at runtime without a reload.
    // We still allow toggling preference in-memory to reflect intent.
    setPrefs((prev) => {
      const next = {
        ...(prev || defaults),
        dev: {
          ...((prev || defaults).dev || {}),
          useMocks: !toBool((prev || defaults).dev?.useMocks, useMocksEnabled),
        },
      };
      return next;
    });
  }, [defaults, useMocksEnabled]);

  if (status.loading) {
    return (
      <Card as="section">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Loading system and application configuration…</p>
        <LoadingSkeleton lines={8} />
      </Card>
    );
  }

  if (!prefs) {
    return (
      <Card as="section">
        <h1 className="page-title">Settings</h1>
        <EmptyState
          title="No settings available"
          description="We couldn't find any configuration to display."
          actionLabel="Reload"
          onAction={load}
        />
      </Card>
    );
  }

  const regionValue = String(prefs.wifi.region || "").toUpperCase();
  const channels2gText = Array.isArray(prefs.wifi.channels2g) ? prefs.wifi.channels2g.join(",") : "";
  const channels5gText = Array.isArray(prefs.wifi.channels5g) ? prefs.wifi.channels5g.join(",") : "";

  const showTopError = Boolean(status.error || saveState.error);

  return (
    <Card as="section">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Global WiFi parameters, application preferences, and integration configuration. Changes are stored in-memory only (no backend persistence yet).
      </p>

      {showTopError ? (
        <div style={{ marginTop: 12 }}>
          <ErrorBanner
            title="Some settings may be unavailable"
            message={[status.error, saveState.error].filter(Boolean).join(" ")}
            onRetry={status.error ? load : undefined}
          />
        </div>
      ) : null}

      <div className="form-grid cols-2" style={{ marginTop: 12 }}>
        <Card flat>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>WiFi: Global parameters</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                Defaults are env-driven where possible; validate before saving.
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={onReset}>
                Reset
              </Button>
              <Button variant="primary" loading={saveState.saving} disabled={hasErrors} onClick={onSaveInMemory}>
                Save (in-memory)
              </Button>
            </div>
          </div>

          {saveState.savedAt ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }} aria-live="polite">
              Saved locally at {new Date(saveState.savedAt).toLocaleString()}.
            </div>
          ) : null}

          <div className="form-grid cols-2" style={{ marginTop: 12 }}>
            <FormField
              label="Region"
              help="Controls regulatory domain defaults (e.g., channel availability)."
              error={errors.region}
            >
              <select
                className="input"
                value={regionValue}
                onChange={(e) => updateWifiField("region", e.target.value)}
              >
                <option value="">Select…</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="GB">GB</option>
                <option value="CA">CA</option>
                <option value="JP">JP</option>
                <option value="AU">AU</option>
                <option value="IN">IN</option>
                <option value="CN">CN</option>
              </select>
            </FormField>

            <FormField
              label="TX power (dBm)"
              help="Global transmit power target (best-effort). Range: 1–30."
              error={errors.txPowerDbm}
            >
              <input
                className="input"
                inputMode="numeric"
                value={String(prefs.wifi.txPowerDbm ?? "")}
                onChange={(e) => updateWifiField("txPowerDbm", toInt(e.target.value, 20))}
              />
            </FormField>

            <FormField
              label="2.4GHz channels"
              help="Comma-separated list (1–11). Example: 1,6,11"
              error={errors.channels2g}
            >
              <input
                className="input"
                value={channels2gText}
                onChange={(e) => updateWifiField("channels2g", parseCsvList(e.target.value).map((n) => toInt(n, 1)))}
                placeholder="1,6,11"
              />
            </FormField>

            <FormField
              label="5GHz channels"
              help="Comma-separated list. Example: 36,40,44,48"
              error={errors.channels5g}
            >
              <input
                className="input"
                value={channels5gText}
                onChange={(e) => updateWifiField("channels5g", parseCsvList(e.target.value).map((n) => toInt(n, 36)))}
                placeholder="36,40,44,48"
              />
            </FormField>

            <FormField
              label="Auto-optimization"
              help="Enable automated tuning of channel selection and parameters."
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.wifi.autoOptimizationEnabled)}
                  onChange={(e) => updateWifiField("autoOptimizationEnabled", e.target.checked)}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  {prefs.wifi.autoOptimizationEnabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </FormField>

            <FormField
              label="Band steering"
              help="Prefer 5GHz when clients support it (best-effort)."
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.wifi.bandSteeringEnabled)}
                  onChange={(e) => updateWifiField("bandSteeringEnabled", e.target.checked)}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  {prefs.wifi.bandSteeringEnabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </FormField>
          </div>

          {hasErrors ? (
            <div style={{ marginTop: 10 }}>
              <ErrorBanner
                title="Validation required"
                message="Some fields need attention. Please fix them before saving."
              />
            </div>
          ) : null}
        </Card>

        <Card flat>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>App & Integrations</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Integration endpoints are read-only placeholders driven by environment variables.
          </div>

          <div className="form-grid cols-2" style={{ marginTop: 12 }}>
            <FormField label="API base (read-only)" help="From REACT_APP_API_BASE.">
              <input className="input" value={prefs.integrations.apiBase} readOnly />
            </FormField>

            <FormField label="WebSocket URL (read-only)" help="From REACT_APP_WS_URL.">
              <input className="input" value={prefs.integrations.wsUrl} readOnly />
            </FormField>

            <FormField
              label="Dense tables"
              help="UI preference (in-memory)."
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.ui.denseTables)}
                  onChange={(e) => updateUiField("denseTables", e.target.checked)}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  {prefs.ui.denseTables ? "On" : "Off"}
                </span>
              </label>
            </FormField>

            <FormField
              label="Show advanced options"
              help="Reveal extra controls and diagnostics (in-memory)."
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.ui.showAdvanced)}
                  onChange={(e) => updateUiField("showAdvanced", e.target.checked)}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  {prefs.ui.showAdvanced ? "On" : "Off"}
                </span>
              </label>
            </FormField>
          </div>

          <Card flat style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Feature flags</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Parsed from REACT_APP_FEATURE_FLAGS.
            </div>

            <div style={{ marginTop: 10 }}>
              <FormField label="Raw flags (read-only)">
                <input className="input" value={prefs.featureFlags.raw || "(unset)"} readOnly />
              </FormField>

              <FormField label="Parsed flags (read-only)" help="This is how the app interprets flags at runtime.">
                <textarea
                  className="input"
                  value={JSON.stringify(prefs.featureFlags.parsed || {}, null, 2)}
                  readOnly
                  rows={6}
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
                />
              </FormField>
            </div>
          </Card>

          <Card flat style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Developer</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Mock mode selection is currently decided at page load (module init). Changing this toggle won’t switch services until reload.
            </div>

            {!flagsSupportMocks ? (
              <div style={{ marginTop: 10 }}>
                <EmptyState
                  title="Mock mode unavailable"
                  description="Set REACT_APP_FEATURE_FLAGS to include useMocks=true/false to enable this control."
                />
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <FormField
                  label="Enable mock mode"
                  help="When enabled (via feature flags), the app uses local mock services instead of real API calls."
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs.dev.useMocks)}
                      onChange={onToggleMockMode}
                    />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>
                      {prefs.dev.useMocks ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </FormField>

                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Current runtime: useMocks={String(useMocksEnabled)} (from feature flags).{" "}
                  {prefs.dev.useMocks !== useMocksEnabled ? "Reload the app to apply changes." : null}
                </div>
              </div>
            )}
          </Card>

          {prefs.ui.showAdvanced ? (
            <Card flat style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>Advanced diagnostics</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                Loaded settings payload (best-effort):
              </div>
              <textarea
                className="input"
                readOnly
                rows={8}
                value={JSON.stringify(lastLoadedRef.current, null, 2)}
                style={{
                  marginTop: 10,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
              />
            </Card>
          ) : null}
        </Card>
      </div>
    </Card>
  );
}

export default SettingsPage;
