import React from "react";

/**
 * Lightweight skeleton blocks for loading placeholders.
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// PUBLIC_INTERFACE
function LoadingSkeleton({ lines = 3, className = "" }) {
  /** Renders a simple list of shimmering skeleton lines. */
  const count = clamp(lines, 1, 12);
  const items = Array.from({ length: count }).map((_, idx) => (
    <div
      // eslint-disable-next-line react/no-array-index-key
      key={idx}
      className="skeleton-line"
      style={{ width: idx === count - 1 ? "62%" : "100%" }}
    />
  ));

  return <div className={["skeleton", className].filter(Boolean).join(" ")}>{items}</div>;
}

export default LoadingSkeleton;
