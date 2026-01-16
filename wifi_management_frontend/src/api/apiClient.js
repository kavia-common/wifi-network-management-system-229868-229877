/**
 * Minimal fetch-based API client.
 * - Reads base URL from env at build time (CRA): REACT_APP_API_BASE (fallback REACT_APP_BACKEND_URL).
 * - Centralizes JSON parsing, timeouts, and error normalization.
 * - Does not call the backend until a service method is invoked.
 */

/**
 * @typedef {Object} ApiErrorDetails
 * @property {string} message Human-readable error message
 * @property {number|null} status HTTP status code (if available)
 * @property {string|null} code Optional machine-readable code (if provided by backend)
 * @property {any} details Additional error payload (if provided by backend)
 */

/**
 * @typedef {Error & { api: ApiErrorDetails }} ApiError
 */

/**
 * Normalize a base URL + path into a URL string.
 * Handles missing/extra slashes safely.
 */
function joinUrl(base, path) {
  const baseTrimmed = String(base || "").replace(/\/+$/, "");
  const pathTrimmed = String(path || "").replace(/^\/+/, "");
  if (!baseTrimmed) return `/${pathTrimmed}`;
  return `${baseTrimmed}/${pathTrimmed}`;
}

/**
 * Best-effort extraction of JSON or text body.
 * Returns `null` for empty bodies.
 */
async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  // 204 or content-length 0: no body
  if (response.status === 204) return null;

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      // If server lied about json, fall back to text.
    }
  }

  try {
    const text = await response.text();
    return text.length ? text : null;
  } catch {
    return null;
  }
}

/**
 * Create a normalized API error object.
 * Ensures consumers can display `err.api.message` safely.
 */
function createApiError({ message, status = null, code = null, details = null, cause }) {
  const err = new Error(message);
  if (cause) err.cause = cause;
  err.api = { message, status, code, details };
  return err;
}

/**
 * Determine the API base URL from environment variables.
 * CRA embeds these at build time.
 */
function getApiBase() {
  const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  return String(base).trim().replace(/\/+$/, "");
}

/**
 * The core request method.
 * @param {string} path API path, e.g. "/networks"
 * @param {Object} [options]
 * @param {string} [options.method]
 * @param {any} [options.body] JS value to JSON.stringify unless FormData/Blob/string.
 * @param {Object} [options.headers]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<any>} parsed response body or null
 */
async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 15000, // sensible default; can be overridden by callers
  } = options;

  const url = joinUrl(getApiBase(), path);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const finalHeaders = { ...headers };

    let finalBody = body;
    const isBodyDefined = typeof body !== "undefined" && body !== null;

    // Default JSON encoding for plain objects.
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
    const isString = typeof body === "string";

    if (isBodyDefined && !isFormData && !isBlob && !isString) {
      finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
      finalBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isBodyDefined && method !== "GET" && method !== "HEAD" ? finalBody : undefined,
      signal: controller.signal,
    });

    const payload = await readResponseBody(response);

    if (!response.ok) {
      // Attempt to normalize common API error formats while keeping it flexible.
      const status = response.status;

      let message = `Request failed (${status})`;
      let code = null;
      let details = payload;

      if (payload && typeof payload === "object") {
        // Common shapes:
        // - { message: "...", code?: "...", details?: ... }
        // - { error: "...", ... }
        message = payload.message || payload.error || message;
        code = payload.code || null;
        details = payload.details ?? payload;
      } else if (typeof payload === "string" && payload.trim().length) {
        message = payload;
      }

      throw createApiError({ message, status, code, details });
    }

    return payload;
  } catch (e) {
    // Normalize AbortError and network errors
    if (e?.name === "AbortError") {
      throw createApiError({
        message: `Request timed out after ${timeoutMs}ms`,
        status: null,
        code: "TIMEOUT",
        details: { timeoutMs },
        cause: e,
      });
    }

    // If it's already an ApiError (has `.api`), pass through.
    if (e && typeof e === "object" && "api" in e) {
      throw e;
    }

    throw createApiError({
      message: "Network error: unable to reach API",
      status: null,
      code: "NETWORK_ERROR",
      details: null,
      cause: e,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

// PUBLIC_INTERFACE
export function apiGet(path, options = {}) {
  /** Perform a GET request against the configured API base. */
  return request(path, { ...options, method: "GET" });
}

// PUBLIC_INTERFACE
export function apiPost(path, body, options = {}) {
  /** Perform a POST request against the configured API base. */
  return request(path, { ...options, method: "POST", body });
}

// PUBLIC_INTERFACE
export function apiPut(path, body, options = {}) {
  /** Perform a PUT request against the configured API base. */
  return request(path, { ...options, method: "PUT", body });
}

// PUBLIC_INTERFACE
export function apiPatch(path, body, options = {}) {
  /** Perform a PATCH request against the configured API base. */
  return request(path, { ...options, method: "PATCH", body });
}

// PUBLIC_INTERFACE
export function apiDelete(path, options = {}) {
  /** Perform a DELETE request against the configured API base. */
  return request(path, { ...options, method: "DELETE" });
}

// PUBLIC_INTERFACE
export function getConfiguredApiBase() {
  /** Returns the resolved API base URL (REACT_APP_API_BASE fallback REACT_APP_BACKEND_URL). */
  return getApiBase();
}
