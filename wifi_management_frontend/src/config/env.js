/**
 * Environment helpers for the frontend.
 * Reads CRA environment variables (REACT_APP_*) with safe fallbacks.
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the configured API base URL, preferring REACT_APP_API_BASE then REACT_APP_BACKEND_URL. */
  const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  return String(base).trim().replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function getWsUrl() {
  /** Returns websocket URL if present (used later for real-time features). */
  const ws = process.env.REACT_APP_WS_URL || "";
  return String(ws).trim();
}

// PUBLIC_INTERFACE
export function getNodeEnv() {
  /** Returns REACT_APP_NODE_ENV or falls back to process.env.NODE_ENV. */
  return process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development";
}

// PUBLIC_INTERFACE
export function parseFeatureFlags() {
  /**
   * Parses REACT_APP_FEATURE_FLAGS.
   * Supported formats:
   * - JSON: {"alerts":true,"advancedVlan":false}
   * - CSV: alerts,advancedVlan
   */
  const raw = process.env.REACT_APP_FEATURE_FLAGS || "";
  const trimmed = String(raw).trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return Object.fromEntries(parsed.map((k) => [String(k), true]));
      }
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return {};
    }
  }

  // CSV
  const flags = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return Object.fromEntries(flags.map((k) => [k, true]));
}
