/**
 * Feature flag parsing utilities.
 *
 * Supports REACT_APP_FEATURE_FLAGS as either:
 *  - Querystring-like: "useMocks=true,foo=bar" or "useMocks=true&foo=bar"
 *  - JSON: {"useMocks":true,"foo":"bar"}
 *  - Simple list: "useMocks,newDashboard" => treats listed flags as true
 *
 * Values are coerced to booleans when they look like booleans.
 */

function coerceValue(raw) {
  const v = String(raw ?? "").trim();
  const lower = v.toLowerCase();

  if (lower === "true" || lower === "1" || lower === "yes" || lower === "on") return true;
  if (lower === "false" || lower === "0" || lower === "no" || lower === "off") return false;

  return v;
}

function parseListStyle(payload) {
  const out = {};
  const cleaned = String(payload || "")
    .trim()
    .replace(/[;]+/g, ",")
    .replace(/[&]+/g, ",");

  if (!cleaned) return out;

  const parts = cleaned
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("=")) {
      const idx = part.indexOf("=");
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key) continue;
      out[key] = coerceValue(value);
    } else {
      // flag-only form implies true
      out[part] = true;
    }
  }

  return out;
}

function parseJsonStyle(payload) {
  const trimmed = String(payload || "").trim();
  if (!trimmed) return null;

  // Only attempt JSON parse when it looks like JSON
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      // Coerce stringy values
      const out = {};
      for (const [k, v] of Object.entries(parsed)) {
        out[k] = typeof v === "string" ? coerceValue(v) : v;
      }
      return out;
    }
    // If someone provides a JSON array like ["useMocks"], treat as truthy list
    if (Array.isArray(parsed)) {
      const out = {};
      for (const item of parsed) {
        if (typeof item === "string" && item.trim()) out[item.trim()] = true;
      }
      return out;
    }
    return {};
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /** Returns a normalized feature flags object parsed from REACT_APP_FEATURE_FLAGS. */
  const raw = process.env.REACT_APP_FEATURE_FLAGS;

  const json = parseJsonStyle(raw);
  if (json !== null) return json;

  return parseListStyle(raw);
}

// PUBLIC_INTERFACE
export function isFeatureEnabled(flagName, defaultValue = false) {
  /** Returns true if a flag is enabled (truthy), with optional default. */
  const flags = getFeatureFlags();
  if (!flagName) return Boolean(defaultValue);

  const v = flags[flagName];
  if (typeof v === "boolean") return v;

  // Common convention: empty string or missing => default
  if (typeof v === "undefined") return Boolean(defaultValue);

  return Boolean(v);
}

// PUBLIC_INTERFACE
export function getFeatureFlagValue(flagName, defaultValue = undefined) {
  /** Returns a raw flag value (string/boolean/number/object) with optional default. */
  const flags = getFeatureFlags();
  if (!flagName) return defaultValue;
  return typeof flags[flagName] === "undefined" ? defaultValue : flags[flagName];
}

// PUBLIC_INTERFACE
export function getFeatureFlagBoolean(flagName, defaultValue = false) {
  /** Returns a boolean flag value (coerces common string forms). */
  const v = getFeatureFlagValue(flagName, defaultValue);
  if (typeof v === "boolean") return v;
  return Boolean(coerceValue(v));
}

// PUBLIC_INTERFACE
export function getFeatureFlagNumber(flagName, defaultValue = 0) {
  /** Returns a numeric flag value (best effort), with optional default. */
  const v = getFeatureFlagValue(flagName, defaultValue);
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

// PUBLIC_INTERFACE
export function getFeatureFlagString(flagName, defaultValue = "") {
  /** Returns a string flag value, with optional default. */
  const v = getFeatureFlagValue(flagName, defaultValue);
  return String(v ?? defaultValue);
}
