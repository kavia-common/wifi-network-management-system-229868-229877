import { isFeatureEnabled } from "../utils/featureFlags";

import { apiDelete, apiGet, apiPatch, apiPost, apiPut, getConfiguredApiBase } from "./apiClient";
import { clientsService as realClientsService } from "./clients";
import { healthService as realHealthService } from "./health";
import { networksService as realNetworksService } from "./networks";
import { settingsService as realSettingsService } from "./settings";

import { clientsService as mockClientsService } from "./mocks/clients";
import { healthService as mockHealthService } from "./mocks/health";
import { networksService as mockNetworksService } from "./mocks/networks";
import { settingsService as mockSettingsService } from "./mocks/settings";

const useMocks = isFeatureEnabled("useMocks", false);

// PUBLIC_INTERFACE
export { getConfiguredApiBase, apiGet, apiPost, apiPut, apiPatch, apiDelete };

// PUBLIC_INTERFACE
export const networksService = useMocks ? mockNetworksService : realNetworksService;

// PUBLIC_INTERFACE
export const clientsService = useMocks ? mockClientsService : realClientsService;

// PUBLIC_INTERFACE
export const settingsService = useMocks ? mockSettingsService : realSettingsService;

// PUBLIC_INTERFACE
export const healthService = useMocks ? mockHealthService : realHealthService;
