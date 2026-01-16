import { createApiClient, withApiErrorHandling } from "./apiClient";
import {
  mockDb,
  delay,
  createNetwork,
  updateNetwork,
  toggleClientBlocked,
  acknowledgeAlert,
  getCurrentUser,
  setCurrentUser,
  updateUser
} from "../data/mockDb";

const api = createApiClient();

function ensureAuthed() {
  const user = getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// PUBLIC_INTERFACE
export const authService = {
  /** Returns current session user or null. */
  getSession: withApiErrorHandling(async () => {
    await api.simulateLatency(250);
    return { user: getCurrentUser() };
  }),

  /** Mock login by selecting a user by email. */
  login: withApiErrorHandling(async ({ email }) => {
    await api.simulateLatency(450);
    const user = mockDb.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || !user.enabled) throw new Error("Invalid credentials");
    setCurrentUser(user.id);
    return { user };
  }),

  /** Logout clears current user. */
  logout: withApiErrorHandling(async () => {
    await api.simulateLatency(150);
    setCurrentUser(null);
    return { ok: true };
  })
};

// PUBLIC_INTERFACE
export const networkService = {
  /** Lists SSID networks. */
  list: withApiErrorHandling(async () => {
    ensureAuthed();
    await delay(420);
    return [...mockDb.networks];
  }),

  /** Creates a new network. */
  create: withApiErrorHandling(async (payload) => {
    ensureAuthed();
    await delay(520);
    return createNetwork(payload);
  }),

  /** Updates an existing network (SSID/security/VLAN/enabled). */
  update: withApiErrorHandling(async (id, patch) => {
    ensureAuthed();
    await delay(520);
    return updateNetwork(id, patch);
  })
};

// PUBLIC_INTERFACE
export const accessPointService = {
  /** Lists access points. */
  list: withApiErrorHandling(async () => {
    ensureAuthed();
    await delay(450);
    return [...mockDb.aps];
  }),

  /** Retrieves an AP with associated clients. */
  getById: withApiErrorHandling(async (apId) => {
    ensureAuthed();
    await delay(450);
    const ap = mockDb.aps.find((a) => a.id === apId);
    if (!ap) throw new Error("Access point not found");
    const clients = mockDb.clients.filter((c) => c.apId === apId);
    return { ...ap, clients };
  })
};

// PUBLIC_INTERFACE
export const clientService = {
  /** Lists clients/devices. */
  list: withApiErrorHandling(async () => {
    ensureAuthed();
    await delay(520);
    return [...mockDb.clients];
  }),

  /** Optimistic-ready block/unblock. */
  setBlocked: withApiErrorHandling(async (clientId, blocked) => {
    ensureAuthed();
    await delay(420);
    return toggleClientBlocked(clientId, blocked);
  })
};

// PUBLIC_INTERFACE
export const alertService = {
  /** Lists alerts. */
  list: withApiErrorHandling(async () => {
    ensureAuthed();
    await delay(380);
    return [...mockDb.alerts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }),

  /** Marks an alert acknowledged. */
  acknowledge: withApiErrorHandling(async (alertId, acknowledged) => {
    ensureAuthed();
    await delay(300);
    return acknowledgeAlert(alertId, acknowledged);
  })
};

// PUBLIC_INTERFACE
export const userService = {
  /** Lists users (admin only). */
  list: withApiErrorHandling(async () => {
    const user = ensureAuthed();
    if (user.role !== "admin") throw new Error("Forbidden");
    await delay(450);
    return [...mockDb.users];
  }),

  /** Enables/disables user (admin only). */
  update: withApiErrorHandling(async (userId, patch) => {
    const user = ensureAuthed();
    if (user.role !== "admin") throw new Error("Forbidden");
    await delay(450);
    return updateUser(userId, patch);
  })
};

// PUBLIC_INTERFACE
export function getApiMeta() {
  /** Returns API configuration metadata for display in settings. */
  return {
    baseUrl: api.baseUrl || "(unset)",
    featureFlags: api.featureFlags || {}
  };
}
