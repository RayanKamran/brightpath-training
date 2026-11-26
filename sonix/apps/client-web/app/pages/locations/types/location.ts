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

export type LocationListResponse = {
  items: DbLocation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type LocationSearchCriteria = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  active?: boolean;
  signal?: AbortSignal;
  token: string;
};
