import {API_CONFIG} from 'core/config/api';
import {apiClient} from 'core/services/apiClient';
import type {
  CreateLocationInput,
  DbLocation,
  LocationListResponse,
  LocationSearchCriteria,
  UpdateLocationInput,
} from '../types/location';

export const locationQueries = {
  fetchAll: async (criteria: LocationSearchCriteria): Promise<LocationListResponse> => {
    const params = new URLSearchParams({
      page: String(criteria.page ?? 1),
      pageSize: String(criteria.pageSize ?? 10),
    });

    if (criteria.searchTerm) {
      params.set('searchTerm', criteria.searchTerm);
    }

    if (criteria.active !== undefined) {
      params.set('active', String(criteria.active));
    }

    return apiClient.get<LocationListResponse>(
      `${API_CONFIG.baseUrl}/locations/db?${params.toString()}`,
      {signal: criteria.signal, token: criteria.token},
    );
  },

  fetchById: async ({
    id,
    signal,
    token,
  }: {
    id: string;
    signal?: AbortSignal;
    token: string;
  }): Promise<DbLocation> => {
    return apiClient.get<DbLocation>(`${API_CONFIG.baseUrl}/locations/db/${id}`, {
      signal,
      token,
    });
  },

  create: async (input: CreateLocationInput, token: string): Promise<DbLocation> => {
    return apiClient.post<DbLocation>(`${API_CONFIG.baseUrl}/locations/db`, input, {token});
  },

  update: async (id: string, input: UpdateLocationInput, token: string): Promise<DbLocation> => {
    return apiClient.patch<DbLocation>(`${API_CONFIG.baseUrl}/locations/db/${id}`, input, {token});
  },

  deactivate: async ({id, token}: {id: string; token: string}): Promise<DbLocation> => {
    return apiClient.delete<DbLocation>(`${API_CONFIG.baseUrl}/locations/db/${id}`, {token});
  },

  activate: async ({id, token}: {id: string; token: string}): Promise<DbLocation> => {
    return apiClient.patch<DbLocation>(
      `${API_CONFIG.baseUrl}/locations/db/${id}`,
      {active: true},
      {token},
    );
  },
};
