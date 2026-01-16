import React, { useEffect } from "react";
import { Button } from "./Button";

// PUBLIC_INTERFACE
export function Modal({ open, title, children, onClose, footer }) {
  /** Accessible modal dialog with overlay and ESC close. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="op-modalOverlay" role="dialog" aria-modal="true" aria-label={title || "Dialog"} onMouseDown={onClose}>
      <div className="op-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="op-modalHeader">
          <div className="op-modalTitle">{title}</div>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>
        <div className="op-modalBody">{children}</div>
        {footer ? <div className="op-modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function ConfirmModal({ open, title = "Confirm", description, confirmText = "Confirm", danger, onConfirm, onClose }) {
  /** Confirmation modal used for destructive/important actions. */
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ color: "var(--op-muted)", lineHeight: 1.45 }}>{description}</div>
    </Modal>
  );
}
