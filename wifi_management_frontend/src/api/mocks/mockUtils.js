/**
 * Shared helpers for mock services.
 * The goal is deterministic, consistent data and small artificial latency
 * so UI states (loading/error/empty) can be exercised without a backend.
 */

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Deterministic latency:
 * - If seed is provided, produces stable pseudo-random delay around base.
 * - Otherwise returns base delay.
 */
function computeDelayMs({ baseMs = 250, jitterMs = 250, seed = "" } = {}) {
  const s = String(seed);
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }

  if (!s) return baseMs;

  const normalized = (hash % 1000) / 1000; // [0, 1)
  return Math.round(baseMs + normalized * jitterMs);
}

// PUBLIC_INTERFACE
export async function withMockLatency(result, { baseMs = 250, jitterMs = 250, seed = "" } = {}) {
  /** Resolves `result` after a deterministic latency to simulate network requests. */
  const delay = computeDelayMs({ baseMs, jitterMs, seed });
  await sleep(delay);
  return result;
}

// PUBLIC_INTERFACE
export function createMockApiError(message, { status = 500, code = "MOCK_ERROR", details = null } = {}) {
  /** Creates an Error object shaped similarly to apiClient's ApiError (`err.api`). */
  const err = new Error(message);
  err.api = { message, status, code, details };
  return err;
}

// Deterministic datasets
export const mockData = {
  networks: [
    { id: "home-ssid", name: "Home WiFi", band: "Dual-band", security: "WPA2", status: "active" },
    { id: "guest-ssid", name: "Guest WiFi", band: "5GHz", security: "WPA2", status: "active" },
    { id: "iot-ssid", name: "IoT", band: "2.4GHz", security: "WPA2", status: "active" },
  ],
  clients: [
    {
      id: "aa:bb:cc:dd:ee:ff",
      name: "Laptop",
      ip: "192.168.1.23",
      status: "online",
      rssi: -48,
      networkId: "home-ssid",
    },
    {
      id: "11:22:33:44:55:66",
      name: "Phone",
      ip: "192.168.1.52",
      status: "online",
      rssi: -55,
      networkId: "home-ssid",
    },
    {
      id: "22:33:44:55:66:77",
      name: "Smart TV",
      ip: "192.168.1.90",
      status: "offline",
      rssi: null,
      networkId: "iot-ssid",
    },
  ],
  settings: {
    countryCode: "US",
    channelPlan: "Auto",
    allowGuestIsolation: true,
    txPower: "Auto",
  },
};
