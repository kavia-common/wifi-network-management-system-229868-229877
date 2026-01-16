import React from "react";

function variantToClass(variant) {
  if (variant === "primary") return "primary";
  if (variant === "warning") return "warning";
  if (variant === "danger") return "danger";
  return "";
}

// PUBLIC_INTERFACE
export function Badge({ variant = "default", children, title }) {
  /** Small badge/tag component for statuses and labels. */
  return (
    <span className={`op-badge ${variantToClass(variant)}`} title={title}>
      {children}
    </span>
  );
}
