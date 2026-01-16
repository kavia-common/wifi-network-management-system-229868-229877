import { createMockApiError, mockData, withMockLatency } from "./mockUtils";

/**
 * Mock Networks service.
 * Mirrors the real service API (list/get/create/update/remove) so call sites
 * can remain unchanged.
 */

function findNetwork(id) {
  return mockData.networks.find((n) => n.id === id) || null;
}

function normalizeCreatePayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const name = String(p.name || p.ssid || "New Network").trim();
  const id = String(p.id || name.toLowerCase().replace(/\s+/g, "-")).trim() || `network-${mockData.networks.length + 1}`;
  return {
    id,
    name,
    band: p.band || "Dual-band",
    security: p.security || "WPA2",
    status: p.status || "active",
  };
}

// PUBLIC_INTERFACE
export const networksService = {
  /** List networks. Mocked. */
  async list() {
    return withMockLatency([...mockData.networks], { seed: "networks:list" });
  },

  /** Get network by id. Mocked. */
  async get(id) {
    const networkId = String(id || "");
    const n = findNetwork(networkId);
    if (!n) {
      throw createMockApiError("Network not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: networkId },
      });
    }
    return withMockLatency({ ...n }, { seed: `networks:get:${networkId}` });
  },

  /** Create network. Mocked (in-memory). */
  async create(payload) {
    const created = normalizeCreatePayload(payload);

    // Ensure unique ID
    if (findNetwork(created.id)) {
      throw createMockApiError("Network already exists", {
        status: 409,
        code: "CONFLICT",
        details: { id: created.id },
      });
    }

    mockData.networks.push(created);
    return withMockLatency({ ...created }, { seed: `networks:create:${created.id}` });
  },

  /** Update network. Mocked (in-memory). */
  async update(id, payload) {
    const networkId = String(id || "");
    const idx = mockData.networks.findIndex((n) => n.id === networkId);
    if (idx < 0) {
      throw createMockApiError("Network not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: networkId },
      });
    }

    const p = payload && typeof payload === "object" ? payload : {};
    const updated = {
      ...mockData.networks[idx],
      ...p,
      id: networkId, // never allow id mutation
    };

    mockData.networks[idx] = updated;
    return withMockLatency({ ...updated }, { seed: `networks:update:${networkId}` });
  },

  /** Delete network. Mocked (in-memory). */
  async remove(id) {
    const networkId = String(id || "");
    const idx = mockData.networks.findIndex((n) => n.id === networkId);
    if (idx < 0) {
      throw createMockApiError("Network not found", {
        status: 404,
        code: "NOT_FOUND",
        details: { id: networkId },
      });
    }

    mockData.networks.splice(idx, 1);
    return withMockLatency({ ok: true }, { seed: `networks:remove:${networkId}` });
  },
};
