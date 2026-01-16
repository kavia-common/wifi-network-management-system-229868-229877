import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function iconFor(type) {
  if (type === "error") return { glyph: "!", className: "danger" };
  if (type === "warning") return { glyph: "!", className: "warning" };
  return { glyph: "✓", className: "" };
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides lightweight toast notifications. */
  const [toasts, setToasts] = useState([]);

  const api = useMemo(() => {
    const push = (toast) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item = { id, type: "success", title: "Done", description: "", ...toast };
      setToasts((prev) => [item, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.durationMs || 3200);
    };

    return {
      toasts,
      pushSuccess: (title, description) => push({ type: "success", title, description }),
      pushWarning: (title, description) => push({ type: "warning", title, description }),
      pushError: (title, description) => push({ type: "error", title, description }),
      dismiss: (id) => setToasts((prev) => prev.filter((t) => t.id !== id))
    };
  }, [toasts]);

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Hook to access toast API. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used inside ToastProvider");
  return ctx;
}

export function ToastRegion() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="op-toastRegion" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => {
        const icon = iconFor(t.type);
        return (
          <div key={t.id} className="op-toast" role="status">
            <div className={`op-toastIcon ${icon.className}`}>{icon.glyph}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="op-toastTitle">{t.title}</p>
              {t.description ? <p className="op-toastDesc">{t.description}</p> : null}
            </div>
            <button className="op-btn sm ghost" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}
