import React from "react";
import Button from "./Button";

/**
 * Empty state helper for lists and detail panes.
 */

// PUBLIC_INTERFACE
function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) {
  /** Displays an empty state with optional action. */
  return (
    <div className={["empty", className].filter(Boolean).join(" ")}>
      <div className="empty-icon" aria-hidden="true">
        {icon || "—"}
      </div>
      <div className="empty-body">
        <div className="empty-title">{title}</div>
        {description ? <div className="empty-desc">{description}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <div className="empty-actions">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
