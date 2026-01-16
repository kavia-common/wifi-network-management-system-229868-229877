export { getConfiguredApiBase } from "./apiClient";
export { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./apiClient";

import { isFeatureEnabled } from "../utils/featureFlags";

import { networksService as realNetworksService } from "./networks";
import { clientsService as realClientsService } from "./clients";
import { settingsService as realSettingsService } from "./settings";
import { healthService as realHealthService } from "./health";

import { networksService as mockNetworksService } from "./mocks/networks";
import { clientsService as mockClientsService } from "./mocks/clients";
import { settingsService as mockSettingsService } from "./mocks/settings";
import { healthService as mockHealthService } from "./mocks/health";

const useMocks = isFeatureEnabled("useMocks", false);

// PUBLIC_INTERFACE
export const networksService = useMocks ? mockNetworksService : realNetworksService;

// PUBLIC_INTERFACE
export const clientsService = useMocks ? mockClientsService : realClientsService;

// PUBLIC_INTERFACE
export const settingsService = useMocks ? mockSettingsService : realSettingsService;

// PUBLIC_INTERFACE
export const healthService = useMocks ? mockHealthService : realHealthService;
