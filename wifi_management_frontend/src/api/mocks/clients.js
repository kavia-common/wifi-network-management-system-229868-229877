import { createMockApiError, mockData, withMockLatency } from "./mockUtils";

/**
 * Mock Clients service.
 * Mirrors real service API (list/get/create/update/remove).
 */

function findClient(id) {
  return mockData.clients.find((c) => c.id === id) || null;
}

function normalizeCreatePayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const id = String(p.id || p.mac || "").trim() || `00:00:00:00:00:${String(mockData.clients.length + 1).padStart(2, "0")}`;
  return {
    id,
    name: String(p.name || "New Device").trim(),
    ip: p.ip || "192.168.1.200",
    status: p.status || "online",
    rssi: typeof p.rssi === "number" ? p.rssi : -50,
    networkId: p.networkId || "home-ssid",
  };
}

// PUBLIC_INTERFACE
export const clientsService = {
  /** List clients. Mocked. */
  async list() {
    return withMockLatency([...mockData.clients], { seed: "clients:list" });
  },

  /** Get client by id. Mocked. */
  async get(id) {
    const clientId = String(id || "");
    const c = findClient(clientId);
    if (!c) {
      throw createMockApiError("Client not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: clientId },
      });
    }
    return withMockLatency({ ...c }, { seed: `clients:get:${clientId}` });
  },

  /** Create client. Mocked (in-memory). */
  async create(payload) {
    const created = normalizeCreatePayload(payload);

    if (findClient(created.id)) {
      throw createMockApiError("Client already exists", {
        status: 409,
        code: "CONFLICT",
        details: { id: created.id },
      });
    }

    mockData.clients.push(created);
    return withMockLatency({ ...created }, { seed: `clients:create:${created.id}` });
  },

  /** Update client. Mocked (in-memory). */
  async update(id, payload) {
    const clientId = String(id || "");
    const idx = mockData.clients.findIndex((c) => c.id === clientId);
    if (idx < 0) {
      throw createMockApiError("Client not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: clientId },
      });
    }

    const p = payload && typeof payload === "object" ? payload : {};
    const updated = {
      ...mockData.clients[idx],
      ...p,
      id: clientId, // immutable id
    };

    mockData.clients[idx] = updated;
    return withMockLatency({ ...updated }, { seed: `clients:update:${clientId}` });
  },

  /** Delete client. Mocked (in-memory). */
  async remove(id) {
    const clientId = String(id || "");
    const idx = mockData.clients.findIndex((c) => c.id === clientId);
    if (idx < 0) {
      throw createMockApiError("Client not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: clientId },
      });
    }

    mockData.clients.splice(idx, 1);
    return withMockLatency({ ok: true }, { seed: `clients:remove:${clientId}` });
  },
};
