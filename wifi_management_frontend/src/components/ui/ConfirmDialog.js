import React, { useEffect, useMemo, useRef } from "react";
import Button from "./Button";
import { useFocusTrap } from "./a11y";

/**
 * Minimal modal confirm dialog.
 * - Uses a basic overlay + panel.
 * - Traps focus while open, returns focus to trigger on close.
 * - Esc closes (onCancel).
 * - Click outside closes (overlay mousedown).
 */

// PUBLIC_INTERFACE
function ConfirmDialog({
  open,
  title = "Confirm",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger", // 'danger' | 'default'
  onConfirm,
  onCancel,
}) {
  /** Modal confirm dialog for destructive actions and confirmations. */
  const dialogRef = useRef(null);
  const titleIdRef = useRef(`confirm-title-${Math.random().toString(36).slice(2)}`);
  const descIdRef = useRef(`confirm-desc-${Math.random().toString(36).slice(2)}`);

  const confirmVariant = useMemo(() => {
    if (tone === "danger") return "secondary"; // amber as caution in this theme
    return "primary";
  }, [tone]);

  const { restoreFocus } = useFocusTrap({
    enabled: open,
    containerRef: dialogRef,
    autoFocus: true,
  });

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      }
    };

    // Capture so we reliably receive Esc even if focus is on a child control
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Ensure focus returns to the triggering control
      restoreFocus();
    };
  }, [open, onCancel, restoreFocus]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleIdRef.current}
        aria-describedby={description ? descIdRef.current : undefined}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" id={titleIdRef.current}>
            {title}
          </div>
        </div>
        {description ? (
          <div className="modal-body" id={descIdRef.current}>
            {description}
          </div>
        ) : null}
        <div className="modal-footer">
          <Button variant="ghost" onClick={onCancel} autoFocus={false}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} autoFocus={false}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
