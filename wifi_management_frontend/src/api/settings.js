import { apiGet, apiPut } from "./apiClient";

/**
 * Settings service.
 * Placeholders only: endpoints are intentionally generic until backend spec is available.
 */

// PUBLIC_INTERFACE
export const settingsService = {
  /** Get app/system settings. GET /settings */
  get() {
    return apiGet("/settings");
  },

  /** Update settings. PUT /settings */
  update(payload) {
    return apiPut("/settings", payload);
  },
};
