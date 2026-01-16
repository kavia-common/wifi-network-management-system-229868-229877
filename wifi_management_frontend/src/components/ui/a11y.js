import React, { useEffect, useRef } from "react";

/**
 * Small accessibility helpers (no external deps).
 */

function getFocusableElements(container) {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(","))).filter(
    (el) =>
      el &&
      typeof el.focus === "function" &&
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true"
  );
}

// PUBLIC_INTERFACE
export function VisuallyHidden({ as: As = "span", children, ...rest }) {
  /** Renders content that is available to screen readers but visually hidden. */
  return (
    <As
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

/**
 * Focus trap for modal/dialog content.
 * - traps Tab/Shift+Tab inside container
 * - optionally auto-focuses the first focusable element
 */
export function useFocusTrap({ enabled, containerRef, autoFocus = true } = {}) {
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    lastFocusedRef.current = document.activeElement;

    const container = containerRef?.current;
    if (autoFocus && container) {
      const focusables = getFocusableElements(container);
      (focusables[0] || container).focus?.();
    }

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const root = containerRef?.current;
      if (!root) return;

      const focusables = getFocusableElements(root);
      if (focusables.length === 0) {
        e.preventDefault();
        root.focus?.();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === root) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [autoFocus, containerRef, enabled]);

  return {
    // PUBLIC_INTERFACE
    restoreFocus() {
      /** Restores focus to the element that was focused prior to the trap enabling. */
      const el = lastFocusedRef.current;
      el?.focus?.();
    },
  };
}

// PUBLIC_INTERFACE
export function getAriaErrorMessage(err, fallback = "Unexpected error") {
  /** Normalizes apiClient/mock errors into a safe message string for UI. */
  const msg = err?.api?.message || err?.message;
  return String(msg || fallback);
}
