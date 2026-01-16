import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

/**
 * Clients service.
 * Placeholders only: endpoints are intentionally generic until backend spec is available.
 */

// PUBLIC_INTERFACE
export const clientsService = {
  /** List clients. GET /clients */
  list() {
    return apiGet("/clients");
  },

  /** Get client by id (MAC or backend id). GET /clients/:id */
  get(id) {
    return apiGet(`/clients/${encodeURIComponent(id)}`);
  },

  /** Create client (if applicable). POST /clients */
  create(payload) {
    return apiPost("/clients", payload);
  },

  /** Update client. PUT /clients/:id */
  update(id, payload) {
    return apiPut(`/clients/${encodeURIComponent(id)}`, payload);
  },

  /** Delete client. DELETE /clients/:id */
  remove(id) {
    return apiDelete(`/clients/${encodeURIComponent(id)}`);
  },
};
