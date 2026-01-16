import React, { useEffect, useMemo, useRef } from "react";
import Button from "./Button";

/**
 * Minimal modal confirm dialog.
 * - Uses a basic overlay + panel.
 * - Focuses the confirm button on open.
 * - Esc closes (onCancel).
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
  const confirmRef = useRef(null);

  const confirmVariant = useMemo(() => {
    if (tone === "danger") return "secondary"; // amber as caution in this theme
    return "primary";
  }, [tone]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      confirmRef.current?.focus?.();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
        </div>
        {description ? <div className="modal-body">{description}</div> : null}
        <div className="modal-footer">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
