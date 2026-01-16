import { mockData, withMockLatency } from "./mockUtils";

/**
 * Mock Settings service.
 * Mirrors real service API (get/update).
 */

// PUBLIC_INTERFACE
export const settingsService = {
  /** Get settings. Mocked. */
  async get() {
    return withMockLatency({ ...mockData.settings }, { seed: "settings:get" });
  },

  /** Update settings. Mocked (in-memory). */
  async update(payload) {
    const p = payload && typeof payload === "object" ? payload : {};
    mockData.settings = { ...mockData.settings, ...p };
    return withMockLatency({ ...mockData.settings }, { seed: "settings:update" });
  },
};
