import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

/**
 * Networks service.
 * Placeholders only: endpoints are intentionally generic until backend spec is available.
 */

// PUBLIC_INTERFACE
export const networksService = {
  /** List networks. GET /networks */
  list() {
    return apiGet("/networks");
  },

  /** Get network by id. GET /networks/:id */
  get(id) {
    return apiGet(`/networks/${encodeURIComponent(id)}`);
  },

  /** Create network. POST /networks */
  create(payload) {
    return apiPost("/networks", payload);
  },

  /** Update network. PUT /networks/:id */
  update(id, payload) {
    return apiPut(`/networks/${encodeURIComponent(id)}`, payload);
  },

  /** Delete network. DELETE /networks/:id */
  remove(id) {
    return apiDelete(`/networks/${encodeURIComponent(id)}`);
  },
};
