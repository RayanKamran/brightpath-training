import {API_CONFIG} from '../config/api';
import type {Location} from '../types/auth';

export type LocationOption = {
  id: string;
  name: string;
  displayName?: string;
};

export type BinOption = {
  id: string;
  binNumber: string;
  description?: string;
  locationId: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface LocationsResponse {
  items: Location[];
  total: number;
  page: number;
  limit: number;
}

export type LocationAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export type LocationAddressRecord = {
  type?: string;
  isPrimary?: boolean;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  region?: string;
  postalCode?: string;
  country: string;
  countryName?: string;
  locationId?: string;
};

export type LocationContact = {
  type: 'phone' | 'email' | 'web';
  label?: string;
  value: string;
};

export type DbLocation = {
  id: string;
  name: string;
  displayName: string | null;
  logtoId: string | null;
  description: string | null;
  active: boolean;
  address: LocationAddress | null;
  addresses: LocationAddressRecord[];
  contacts: LocationContact[];
};

export type CreateLocationInput = {
  name: string;
  displayName?: string;
  description?: string;
  active?: boolean;
  address?: LocationAddress;
  addresses?: LocationAddressRecord[];
  contacts?: LocationContact[];
};

export type UpdateLocationInput = {
  displayName?: string;
  description?: string;
  active?: boolean;
  address?: LocationAddress | null;
  addresses?: LocationAddressRecord[];
  contacts?: LocationContact[];
};

interface DbLocationsResponse {
  items: DbLocation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const locationApi = {
  async getLocations(
    accessToken: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<LocationsResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch locations: ${errorText}`, response.status);
    }

    // Backend returns UserLocation[] directly, not paginated
    const locations: Location[] = await response.json();

    // Apply client-side search filtering if provided
    let filteredLocations = locations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLocations = locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchLower) ||
          loc.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply client-side pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedLocations = filteredLocations.slice(start, end);

    return {
      items: paginatedLocations,
      total: filteredLocations.length,
      page,
      limit,
    };
  },

  async getLocation(accessToken: string, locationId: string): Promise<Location> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch location: ${errorText}`, response.status);
    }

    return response.json();
  },

  async getDbLocations(
    accessToken: string,
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    active?: boolean,
  ): Promise<DbLocationsResponse> {
    const params = new URLSearchParams({page: String(page), pageSize: String(pageSize)});
    if (searchTerm) {
      params.set('searchTerm', searchTerm);
    }
    if (active !== undefined) {
      params.set('active', String(active));
    }
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db?${params.toString()}`, {
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch locations: ${errorText}`, response.status);
    }
    return response.json();
  },

  async getDbLocation(accessToken: string, id: string): Promise<DbLocation> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db/${id}`, {
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to fetch location: ${errorText}`, response.status);
    }
    return response.json();
  },

  async createLocation(accessToken: string, input: CreateLocationInput): Promise<DbLocation> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to create location: ${errorText}`, response.status);
    }
    return response.json();
  },

  async updateLocation(
    accessToken: string,
    id: string,
    input: UpdateLocationInput,
  ): Promise<DbLocation> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db/${id}`, {
      method: 'PATCH',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to update location: ${errorText}`, response.status);
    }
    return response.json();
  },

  async deactivateLocation(accessToken: string, id: string): Promise<DbLocation> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db/${id}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to deactivate location: ${errorText}`, response.status);
    }
    return response.json();
  },

  async activateLocation(accessToken: string, id: string): Promise<DbLocation> {
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db/${id}`, {
      method: 'PATCH',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({active: true}),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to activate location: ${errorText}`, response.status);
    }
    return response.json();
  },

  async searchLocations(accessToken: string, searchTerm: string): Promise<LocationOption[]> {
    const params = new URLSearchParams({searchTerm, pageSize: '20'});
    const response = await fetch(`${API_CONFIG.baseUrl}/locations/db?${params}`, {
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as {items: LocationOption[]};
    return data.items ?? [];
  },

  async searchBins(
    accessToken: string,
    locationId: string,
    searchTerm: string,
  ): Promise<BinOption[]> {
    const params = new URLSearchParams({locationId, searchTerm, pageSize: '20'});
    const response = await fetch(`${API_CONFIG.baseUrl}/bins?${params}`, {
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as {items: BinOption[]};
    return data.items ?? [];
  },
};
