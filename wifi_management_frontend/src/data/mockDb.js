/**
 * In-memory mock DB for WiFi management app.
 * This is intentionally stateful (module singleton) to simulate real backend mutations.
 */

const randomId = () => Math.random().toString(36).slice(2, 10);

const nowIso = () => new Date().toISOString();

const mkMac = (i) =>
  `AA:BB:CC:${String(i).padStart(2, "0")}:${String((i * 7) % 100).padStart(2, "0")}:${String((i * 13) % 100).padStart(2, "0")}`;

const mkIp = (i) => `192.168.1.${(20 + i) % 250}`;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const seedNetworks = () => [
  {
    id: "net-main",
    name: "Ocean-Guest",
    ssid: "Ocean-Guest",
    security: "WPA2",
    vlan: 20,
    enabled: true,
    createdAt: nowIso()
  },
  {
    id: "net-staff",
    name: "Ocean-Staff",
    ssid: "Ocean-Staff",
    security: "WPA3",
    vlan: 10,
    enabled: true,
    createdAt: nowIso()
  },
  {
    id: "net-iot",
    name: "Ocean-IoT",
    ssid: "Ocean-IoT",
    security: "WPA2",
    vlan: 30,
    enabled: false,
    createdAt: nowIso()
  }
];

const seedAps = () => [
  {
    id: "ap-hq-1",
    name: "HQ-AP-1",
    site: "HQ",
    status: "online",
    channel: 36,
    throughputMbps: 220,
    uplink: "1G",
    networkId: "net-staff",
    lastSeenAt: nowIso()
  },
  {
    id: "ap-hq-2",
    name: "HQ-AP-2",
    site: "HQ",
    status: "degraded",
    channel: 6,
    throughputMbps: 95,
    uplink: "1G",
    networkId: "net-main",
    lastSeenAt: nowIso()
  },
  {
    id: "ap-branch-1",
    name: "Branch-AP-1",
    site: "Branch",
    status: "offline",
    channel: 11,
    throughputMbps: 0,
    uplink: "100M",
    networkId: "net-main",
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  }
];

const seedClients = () =>
  Array.from({ length: 22 }).map((_, idx) => {
    const apId = idx % 3 === 0 ? "ap-hq-2" : "ap-hq-1";
    const networkId = idx % 4 === 0 ? "net-main" : "net-staff";
    const quality = clamp(40 + ((idx * 9) % 60), 0, 100);
    return {
      id: `cl-${idx + 1}`,
      name: idx % 5 === 0 ? `Device-${idx + 1}` : `Client-${idx + 1}`,
      mac: mkMac(idx + 1),
      ip: mkIp(idx + 1),
      apId,
      networkId,
      quality,
      blocked: idx % 9 === 0,
      rxMbps: clamp(5 + (idx % 8) * 3, 0, 80),
      txMbps: clamp(3 + (idx % 6) * 4, 0, 70),
      lastSeenAt: nowIso()
    };
  });

const seedAlerts = () => [
  {
    id: "al-1",
    severity: "critical",
    title: "AP offline",
    description: "Branch-AP-1 has not checked in for 55 minutes.",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  },
  {
    id: "al-2",
    severity: "warning",
    title: "High interference detected",
    description: "Channel utilization is high near HQ-AP-2.",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    id: "al-3",
    severity: "info",
    title: "New client connected",
    description: "Client-7 connected to HQ-AP-1.",
    acknowledged: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
];

const seedUsers = () => [
  { id: "u-1", name: "Avery Admin", email: "admin@ocean.local", role: "admin", enabled: true },
  { id: "u-2", name: "Noah Operator", email: "ops@ocean.local", role: "operator", enabled: true },
  { id: "u-3", name: "Riley Viewer", email: "viewer@ocean.local", role: "viewer", enabled: true }
];

export const mockDb = {
  networks: seedNetworks(),
  aps: seedAps(),
  clients: seedClients(),
  alerts: seedAlerts(),
  users: seedUsers(),
  session: {
    currentUserId: "u-1"
  }
};

export function delay(ms = 450) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCurrentUser() {
  const user = mockDb.users.find((u) => u.id === mockDb.session.currentUserId) || null;
  return user && user.enabled ? user : null;
}

export function setCurrentUser(userId) {
  mockDb.session.currentUserId = userId;
}

export function createNetwork(payload) {
  const newNet = {
    id: `net-${randomId()}`,
    name: payload.name || payload.ssid,
    ssid: payload.ssid,
    security: payload.security || "WPA2",
    vlan: Number(payload.vlan || 1),
    enabled: Boolean(payload.enabled ?? true),
    createdAt: nowIso()
  };
  mockDb.networks = [newNet, ...mockDb.networks];
  return newNet;
}

export function updateNetwork(id, patch) {
  const idx = mockDb.networks.findIndex((n) => n.id === id);
  if (idx < 0) throw new Error("Network not found");
  mockDb.networks[idx] = { ...mockDb.networks[idx], ...patch };
  return mockDb.networks[idx];
}

export function toggleClientBlocked(clientId, blocked) {
  const idx = mockDb.clients.findIndex((c) => c.id === clientId);
  if (idx < 0) throw new Error("Client not found");
  mockDb.clients[idx] = { ...mockDb.clients[idx], blocked: Boolean(blocked) };
  return mockDb.clients[idx];
}

export function acknowledgeAlert(alertId, acknowledged) {
  const idx = mockDb.alerts.findIndex((a) => a.id === alertId);
  if (idx < 0) throw new Error("Alert not found");
  mockDb.alerts[idx] = { ...mockDb.alerts[idx], acknowledged: Boolean(acknowledged) };
  return mockDb.alerts[idx];
}

export function updateUser(userId, patch) {
  const idx = mockDb.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found");
  mockDb.users[idx] = { ...mockDb.users[idx], ...patch };
  return mockDb.users[idx];
}
