import React from "react";

/**
 * Reusable button with consistent theme styling.
 */

function getVariantClass(variant) {
  if (variant === "primary") return "btn-primary";
  if (variant === "secondary") return "btn-secondary";
  if (variant === "ghost") return "btn-ghost";
  return "";
}

// PUBLIC_INTERFACE
function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...rest
}) {
  /** Themed button supporting primary/secondary/ghost variants and loading state. */
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={["btn", getVariantClass(variant), className].filter(Boolean).join(" ")}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      {...rest}
    >
      <span className="btn-inner">
        {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
        <span className="btn-label">{children}</span>
      </span>
    </button>
  );
}

export default Button;
