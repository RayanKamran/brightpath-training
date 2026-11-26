import {API_CONFIG} from 'core/config/api';
import {apiClient} from 'core/services/apiClient';
import type {
  PartCreateInput,
  PartCreateResult,
  PartDetail,
  PartListResponse,
  PartSearchCriteria,
} from '../types/part';

export const partQueries = {
  create: async (input: PartCreateInput, token: string): Promise<PartCreateResult> => {
    return apiClient.post<PartCreateResult>(`${API_CONFIG.baseUrl}/parts`, input, {token});
  },

  fetchAll: async (searchCriteria: PartSearchCriteria): Promise<PartListResponse> => {
    const params = new URLSearchParams();
    params.set('locationId', searchCriteria.locationId);
    if (searchCriteria.searchTerm) {
      params.set('searchTerm', searchCriteria.searchTerm);
    }
    if (searchCriteria.page) {
      params.set('page', searchCriteria.page.toString());
    }
    if (searchCriteria.pageSize) {
      params.set('pageSize', searchCriteria.pageSize.toString());
    }

    return apiClient.get<PartListResponse>(`${API_CONFIG.baseUrl}/parts?${params.toString()}`, {
      signal: searchCriteria.signal,
      token: searchCriteria.token,
      refreshToken: searchCriteria.refreshToken,
    });
  },

  fetchById: async ({
    id,
    signal,
    token,
    refreshToken,
  }: {
    id: string;
    signal?: AbortSignal;
    token?: string;
    refreshToken?: () => Promise<string | null>;
  }): Promise<PartDetail> => {
    return apiClient.get<PartDetail>(`${API_CONFIG.baseUrl}/parts/${id}`, {
      signal,
      token,
      refreshToken,
    });
  },

  fetchPartStatusCodes: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string}>> => {
    return apiClient.get<Array<{code: string; description: string}>>(
      `${API_CONFIG.baseUrl}/part-status-codes`,
      {signal, token},
    );
  },

  fetchUoms: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string}>> => {
    return apiClient.get<Array<{code: string; description: string}>>(`${API_CONFIG.baseUrl}/uoms`, {
      signal,
      token,
    });
  },

  fetchInitialVendors: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{vendorNumber: string; name: string}>> => {
    const params = new URLSearchParams({pageSize: '10'});
    const res = await apiClient.get<{items: Array<{vendorNumber: string; name: string}>}>(
      `${API_CONFIG.baseUrl}/vendors?${params.toString()}`,
      {signal, token},
    );

    return res.items;
  },

  fetchInitialBins: async ({
    locationId,
    signal,
    token,
  }: {
    locationId: string;
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string | null}>> => {
    const params = new URLSearchParams({locationId, pageSize: '10'});
    const res = await apiClient.get<{items: Array<{code: string; description: string | null}>}>(
      `${API_CONFIG.baseUrl}/bins?${params.toString()}`,
      {signal, token},
    );

    return res.items;
  },

  fetchInitialParts: async ({
    locationId,
    signal,
    token,
  }: {
    locationId: string;
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{partNumber: string; description: string}>> => {
    const params = new URLSearchParams({locationId, pageSize: '10'});
    const res = await apiClient.get<{items: Array<{partNumber: string; description: string}>}>(
      `${API_CONFIG.baseUrl}/parts?${params.toString()}`,
      {signal, token},
    );

    return res.items;
  },

  searchParts: async (
    locationId: string,
    searchTerm: string,
    token: string | null,
    signal: AbortSignal,
  ): Promise<Array<{partNumber: string; description: string}>> => {
    const params = new URLSearchParams({locationId, searchTerm, pageSize: '10'});
    const res = await apiClient.get<{items: Array<{partNumber: string; description: string}>}>(
      `${API_CONFIG.baseUrl}/parts?${params.toString()}`,
      {token, signal},
    );

    return res.items;
  },

  searchVendors: async (
    searchTerm: string,
    token: string | null,
    signal: AbortSignal,
  ): Promise<Array<{vendorNumber: string; name: string}>> => {
    const params = new URLSearchParams({searchTerm, pageSize: '10'});
    const res = await apiClient.get<{items: Array<{vendorNumber: string; name: string}>}>(
      `${API_CONFIG.baseUrl}/vendors?${params.toString()}`,
      {token, signal},
    );

    return res.items;
  },

  searchBins: async (
    locationId: string,
    searchTerm: string,
    token: string | null,
    signal: AbortSignal,
  ): Promise<Array<{code: string; description: string | null}>> => {
    const params = new URLSearchParams({locationId, searchTerm, pageSize: '10'});
    const res = await apiClient.get<{items: Array<{code: string; description: string | null}>}>(
      `${API_CONFIG.baseUrl}/bins?${params.toString()}`,
      {token, signal},
    );

    return res.items;
  },

  fetchGlGroups: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string}>> => {
    return apiClient.get<Array<{code: string; description: string}>>(
      `${API_CONFIG.baseUrl}/gl-groups`,
      {signal, token},
    );
  },

  fetchTaxCodes: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string; rate: number | null}>> => {
    return apiClient.get<Array<{code: string; description: string; rate: number | null}>>(
      `${API_CONFIG.baseUrl}/tax-codes`,
      {signal, token},
    );
  },

  fetchSaleCategories: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string; defaultGlGroupCode: string | null}>> => {
    return apiClient.get<
      Array<{code: string; description: string; defaultGlGroupCode: string | null}>
    >(`${API_CONFIG.baseUrl}/sale-categories`, {signal, token});
  },

  fetchShipWeightCodes: async ({
    signal,
    token,
  }: {
    signal?: AbortSignal;
    token?: string | null;
  }): Promise<Array<{code: string; description: string}>> => {
    return apiClient.get<Array<{code: string; description: string}>>(
      `${API_CONFIG.baseUrl}/ship-weight-codes`,
      {signal, token},
    );
  },
};
