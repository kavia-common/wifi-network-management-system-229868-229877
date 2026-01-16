import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login placeholder for mock auth; enter email to select a seeded user. */
  const nav = useNavigate();
  const { isAuthed, login } = useAuth();
  const toasts = useToasts();

  const [email, setEmail] = useState("admin@ocean.local");
  const [busy, setBusy] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email);
      toasts.pushSuccess("Signed in", email);
      nav("/");
    } catch (err) {
      toasts.pushError("Login failed", err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="op-card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>Login</div>
      <div style={{ color: "var(--op-muted)", fontSize: 12, marginTop: 4 }}>
        Mock auth: use <strong>admin@ocean.local</strong>, <strong>ops@ocean.local</strong>, or <strong>viewer@ocean.local</strong>.
      </div>
      <div className="op-divider" />
      <form onSubmit={onSubmit} className="op-grid" style={{ gap: 10 }}>
        <label>
          <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Email</div>
          <input className="op-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </label>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
