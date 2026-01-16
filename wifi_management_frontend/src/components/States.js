import React from "react";

// PUBLIC_INTERFACE
export function LoadingState({ title = "Loading…" }) {
  /** Simple loading state block. */
  return (
    <div className="op-state" role="status" aria-live="polite">
      <strong style={{ color: "var(--op-text)" }}>{title}</strong>
      <div style={{ marginTop: 6 }}>Fetching latest data.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function EmptyState({ title = "Nothing here", description = "Try adjusting filters or adding a new item." }) {
  /** Empty state block. */
  return (
    <div className="op-state">
      <strong style={{ color: "var(--op-text)" }}>{title}</strong>
      <div style={{ marginTop: 6 }}>{description}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function ErrorState({ title = "Something went wrong", error, onRetry }) {
  /** Error state block with optional retry. */
  return (
    <div className="op-state" role="alert">
      <strong style={{ color: "var(--op-error)" }}>{title}</strong>
      <div style={{ marginTop: 6 }}>{error?.message || String(error || "Unknown error")}</div>
      {onRetry ? (
        <div style={{ marginTop: 10 }}>
          <button className="op-btn sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
