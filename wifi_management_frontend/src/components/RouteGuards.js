import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { LoadingState } from "./States";

// PUBLIC_INTERFACE
export function RequireAuth({ children }) {
  /** Redirects to /login if not authenticated. */
  const { isAuthed, loading } = useAuth();
  if (loading) return <LoadingState title="Checking session…" />;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

// PUBLIC_INTERFACE
export function RequireAdmin({ children }) {
  /** Restricts access to admin-only pages. */
  const { isAuthed, loading, canAdmin } = useAuth();
  if (loading) return <LoadingState title="Checking permissions…" />;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!canAdmin) return <Navigate to="/" replace />;
  return children;
}
