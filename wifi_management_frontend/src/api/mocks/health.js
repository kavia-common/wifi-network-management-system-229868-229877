import { withMockLatency } from "./mockUtils";

/**
 * Mock Health service.
 * Mirrors real service API (getHealth/getStatus).
 */

function buildHealthPayload() {
  // Deterministic-ish but time-aware; stable structure for UI.
  const now = new Date();
  const minute = now.getMinutes();
  const degraded = minute % 10 === 0;

  return {
    status: degraded ? "degraded" : "ok",
    timestamp: now.toISOString(),
    services: {
      api: degraded ? "degraded" : "ok",
      db: "ok",
      wifiController: degraded ? "degraded" : "ok",
    },
  };
}

// PUBLIC_INTERFACE
export const healthService = {
  /** Basic health check. Mocked. */
  async getHealth() {
    return withMockLatency(buildHealthPayload(), { seed: "health:getHealth", baseMs: 180, jitterMs: 220 });
  },

  /** Alias. Mocked. */
  async getStatus() {
    return withMockLatency(buildHealthPayload(), { seed: "health:getStatus", baseMs: 180, jitterMs: 220 });
  },
};
