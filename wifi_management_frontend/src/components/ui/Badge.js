import React from "react";

/**
 * Small status badge.
 */

function getBadgeClass(variant) {
  if (variant === "success") return "badge-success";
  if (variant === "error") return "badge-error";
  if (variant === "warn") return "badge-warn";
  if (variant === "info") return "badge-info";
  return "";
}

// PUBLIC_INTERFACE
function Badge({ children, variant = "neutral", className = "", ...rest }) {
  /** Status badge with variants: neutral/success/warn/error/info. */
  return (
    <span
      className={["badge", getBadgeClass(variant), className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
