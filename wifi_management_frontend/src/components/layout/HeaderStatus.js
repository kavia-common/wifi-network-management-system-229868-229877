import React, { useMemo, useState } from "react";

/**
 * Placeholder/stubbed status source.
 * Later this can be connected to backend/WS health endpoints using REACT_APP_API_BASE/REACT_APP_WS_URL.
 */
function getStubbedStatus() {
  const hour = new Date().getHours();
  if (hour % 6 === 0) return { level: "warn", label: "Degraded" };
  return { level: "ok", label: "Online" };
}

// PUBLIC_INTERFACE
function HeaderStatus() {
  /** Header component that displays the current network/system status (stubbed for now). */
  const [status] = useState(() => getStubbedStatus());

  const dotClassName = useMemo(() => {
    if (status.level === "ok") return "status-dot ok";
    if (status.level === "warn") return "status-dot warn";
    return "status-dot err";
  }, [status.level]);

  return (
    <div className="status-pill" aria-label="Network status">
      <span className={dotClassName} aria-hidden="true" />
      <span>
        Status: <strong>{status.label}</strong>
      </span>
    </div>
  );
}

export default HeaderStatus;
