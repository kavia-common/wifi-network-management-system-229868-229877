import React from "react";
import { Badge } from "./Badge";

// PUBLIC_INTERFACE
export function StatCards({ stats }) {
  /** Renders a responsive set of KPI cards. */
  return (
    <div className="op-grid cols-3">
      {stats.map((s) => (
        <div key={s.key} className="op-card">
          <div className="op-stat">
            <div className="op-statMain">
              <div className="op-statLabel">{s.label}</div>
              <div className="op-statValue">{s.value}</div>
              {s.delta ? (
                <div className="op-statDelta" style={{ color: s.deltaColor || "var(--op-muted)" }}>
                  {s.delta}
                </div>
              ) : null}
            </div>
            {s.badge ? <Badge variant={s.badge.variant}>{s.badge.text}</Badge> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
