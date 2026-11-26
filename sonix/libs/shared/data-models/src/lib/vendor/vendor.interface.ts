/**
 * Vendor Interface
 * Shared type definition for Vendor entity
 */

import type {DmsBaseEntity, EmailAddress, IntlAddress, IntlPhoneNumber} from '../common/index.js';

export interface Vendor extends DmsBaseEntity {
  name: string;
  terms?: string;
  addresses?: IntlAddress[];
  emails: EmailAddress[];
  phones: IntlPhoneNumber[];
}

/**
 * Vendor list item for table displays
 */
export interface VendorListItem {
  name: string;
  terms?: string;
}

/**
 * Vendor list response with pagination
 */
export interface VendorListResponse {
  data: VendorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Vendor search criteria
 */
export interface VendorSearchCriteria {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
