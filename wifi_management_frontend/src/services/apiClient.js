import { getApiBaseUrl, parseFeatureFlags } from "../config/env";
import { delay } from "../data/mockDb";

/**
 * A minimal API client wrapper.
 * For now, it uses mock adapters, but keeps a consistent async interface
 * so it can be swapped to real fetch() calls later.
 */

function normalizeError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error");
}

export class ApiClient {
  constructor({ baseUrl, featureFlags } = {}) {
    this.baseUrl = baseUrl ?? getApiBaseUrl();
    this.featureFlags = featureFlags ?? parseFeatureFlags();
  }

  async request(_path, _options = {}) {
    // Placeholder for future real backend integration.
    // If later enabled, use: fetch(`${this.baseUrl}${path}`, { ... })
    throw new Error("Real HTTP client not enabled in this template. Use mock adapters.");
  }

  async simulateLatency(ms = 450) {
    await delay(ms);
  }
}

// PUBLIC_INTERFACE
export function createApiClient() {
  /** Creates a configured API client using environment variables. */
  return new ApiClient();
}

// PUBLIC_INTERFACE
export function withApiErrorHandling(fn) {
  /** Wraps async calls and normalizes errors. */
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      throw normalizeError(e);
    }
  };
}
