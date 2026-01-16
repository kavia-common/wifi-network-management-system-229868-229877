import { apiGet } from "./apiClient";

/**
 * Health/status service.
 * Placeholders only: endpoint is intentionally generic until backend spec is available.
 */

// PUBLIC_INTERFACE
export const healthService = {
  /** Basic health check. GET /health */
  getHealth() {
    return apiGet("/health", { timeoutMs: 6000 });
  },

  /**
   * Alias for callers that prefer "status" naming.
   * GET /health
   */
  getStatus() {
    return apiGet("/health", { timeoutMs: 6000 });
  },
};
