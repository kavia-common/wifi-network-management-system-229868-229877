import React from "react";

function classForVariant(variant) {
  if (variant === "primary") return "primary";
  if (variant === "danger") return "danger";
  if (variant === "ghost") return "ghost";
  return "";
}

// PUBLIC_INTERFACE
export function Button({ variant = "default", size = "md", children, ...props }) {
  /** Themed button supporting variant and sizing. */
  const sizeClass = size === "sm" ? "sm" : "";
  return (
    <button className={`op-btn ${classForVariant(variant)} ${sizeClass}`} {...props}>
      {children}
    </button>
  );
}
