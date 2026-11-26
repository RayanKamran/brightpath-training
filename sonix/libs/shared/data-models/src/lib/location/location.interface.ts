import type {DmsBaseEntity, IntlAddress} from '../common/index.js';
import type {CurrencyCode} from '../money/index.js';

/**
 * Database Location Interface
 * Shared type definition for database-backed Location entity
 */
export interface DbLocation extends DmsBaseEntity {
  name: string;
  displayName?: string | null;
  logtoId?: string | null;
  description?: string | null;
  address?: IntlAddress;
  active: boolean;
  /** ISO 4217 currency code used as the default for all monetary values at this location. */
  defaultCurrency: CurrencyCode;
}

/**
 * Database location list item for table displays
 */
export interface DbLocationListItem {
  id: string;
  name: string;
  active: boolean;
}

/**
 * Database location list response with pagination
 */
export interface DbLocationListResponse {
  data: DbLocationListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Database location search criteria
 */
export interface DbLocationSearchCriteria {
  searchTerm?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}
