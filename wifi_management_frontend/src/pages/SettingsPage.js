import React, { useMemo } from "react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { getApiMeta } from "../services";
import { useAppState } from "../state/AppStateContext";
import { getNodeEnv, getWsUrl } from "../config/env";

// PUBLIC_INTERFACE
export function SettingsPage() {
  /** Settings: theme toggle, feature flags, env API base/WS info. */
  const { theme, toggleTheme } = useAppState();
  const meta = useMemo(() => getApiMeta(), []);
  const nodeEnv = getNodeEnv();
  const wsUrl = getWsUrl();

  const flags = meta.featureFlags || {};
  const flagEntries = Object.entries(flags);

  return (
    <div className="op-grid">
      <div className="op-card">
        <div style={{ fontWeight: 900 }}>Appearance</div>
        <div className="op-divider" />
        <div className="op-actionsRow">
          <Badge variant="primary">Theme: {theme}</Badge>
          <Button variant="primary" onClick={toggleTheme}>
            Toggle theme
          </Button>
        </div>
      </div>

      <div className="op-card">
        <div style={{ fontWeight: 900 }}>Environment</div>
        <div className="op-divider" />
        <div className="op-grid" style={{ gap: 10 }}>
          <div className="op-state">
            <strong style={{ color: "var(--op-text)" }}>API base</strong>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: "var(--op-muted)" }}>{meta.baseUrl}</span>
            </div>
          </div>
          <div className="op-state">
            <strong style={{ color: "var(--op-text)" }}>WebSocket URL</strong>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: "var(--op-muted)" }}>{wsUrl || "(unset)"}</span>
            </div>
          </div>
          <div className="op-state">
            <strong style={{ color: "var(--op-text)" }}>Node env</strong>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: "var(--op-muted)" }}>{nodeEnv}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="op-card">
        <div style={{ fontWeight: 900 }}>Feature flags</div>
        <div className="op-divider" />
        {flagEntries.length ? (
          <div className="op-actionsRow">
            {flagEntries.map(([k, v]) => (
              <Badge key={k} variant={v ? "primary" : ""}>
                {k}: {String(v)}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="op-state">
            No flags detected. Set <strong>REACT_APP_FEATURE_FLAGS</strong> (JSON or CSV) to enable features.
          </div>
        )}
      </div>
    </div>
  );
}
