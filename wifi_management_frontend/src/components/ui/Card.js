import React from "react";

/**
 * Shared card container that matches the Ocean Professional theme.
 */

// PUBLIC_INTERFACE
function Card({
  children,
  className = "",
  flat = false,
  as: Component = "div",
  ...rest
}) {
  /** Reusable card container with optional "flat" style (no shadow). */
  const cls = ["card", flat ? "card-flat" : "", className].filter(Boolean).join(" ");
  return (
    <Component className={cls} {...rest}>
      {children}
    </Component>
  );
}

export default Card;
