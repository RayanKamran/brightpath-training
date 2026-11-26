/**
 * Address Domain Models and DTOs
 *
 * Enterprise-grade address types supporting global address formats,
 * geocoding, validation, and analytics.
 */

import type {
  AddressType,
  AddressVerificationStatus,
  DmsBaseEntity,
  GeocodingAccuracy,
} from '../common/index.js';

/**
 * Geocoding Data
 */
export interface GeocodingData {
  latitude: number;
  longitude: number;
  accuracy?: GeocodingAccuracy;
  placeId?: string;
  timeZone?: string;
}

/**
 * Address Verification Details
 */
export interface VerificationDetails {
  dpv?: string; // Delivery Point Validation (USPS)
  rdi?: string; // Residential Delivery Indicator
  footnotes?: string[]; // Verification footnotes/warnings
  suggestions?: string[]; // Suggested corrections
}

/**
 * Core Address Entity Interface
 */
export interface Address extends DmsBaseEntity {
  // Identification & Classification
  type: AddressType;
  label?: string;
  isPrimary: boolean;

  // Structured Address Components
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  locality: string;
  region?: string;
  postalCode?: string;
  country: string; // ISO 3166-1 alpha-2 country code
  countryName?: string;

  // Extended Components
  subLocality?: string;
  sortingCode?: string;
  administrativeArea?: string;

  // Unstructured/Display Format
  formattedAddress?: string;

  // Geocoding & Mapping
  geocoding?: GeocodingData;

  // Verification & Validation
  verificationStatus?: AddressVerificationStatus;
  verificationDate?: Date;
  verificationProvider?: string;
  verificationDetails?: VerificationDetails;

  // Search & Analytics
  searchableText?: string;
  normalizedPostalCode?: string;
  geoHash?: string;
  plus4?: string;
  deliveryPoint?: string;

  // Metadata
  notes?: string;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;

  // Multi-tenant Location Scoping
  locationId: string;
}

/**
 * DTO for creating a new address
 */
export class CreateAddressDto {
  type!: AddressType;
  label?: string;
  isPrimary?: boolean;

  addressLine1!: string;
  addressLine2?: string;
  addressLine3?: string;
  locality!: string;
  region?: string;
  postalCode?: string;
  country!: string; // ISO 3166-1 alpha-2
  countryName?: string;

  subLocality?: string;
  sortingCode?: string;
  administrativeArea?: string;

  formattedAddress?: string;
  geocoding?: GeocodingData;

  notes?: string;
  isActive?: boolean;
  validFrom?: Date;
  validTo?: Date;

  locationId!: string;
}

/**
 * DTO for updating an address
 */
export class UpdateAddressDto {
  type?: AddressType;
  label?: string;
  isPrimary?: boolean;

  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  countryName?: string;

  subLocality?: string;
  sortingCode?: string;
  administrativeArea?: string;

  formattedAddress?: string;
  geocoding?: GeocodingData;

  verificationStatus?: AddressVerificationStatus;
  verificationDate?: Date;
  verificationProvider?: string;
  verificationDetails?: VerificationDetails;

  searchableText?: string;
  normalizedPostalCode?: string;
  geoHash?: string;
  plus4?: string;
  deliveryPoint?: string;

  notes?: string;
  isActive?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

/**
 * Address Entity Search Criteria
 * Renamed to avoid conflict with AddressSearchCriteria in common/address-types
 */
export interface AddressEntitySearchCriteria {
  searchTerm?: string;
  locationId?: string;
  country?: string;
  region?: string;
  locality?: string;
  type?: AddressType;
  isActive?: boolean;
  verificationStatus?: AddressVerificationStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Address List Response
 */
export interface AddressListResponse {
  data: Address[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Junction Entity Interfaces
 * Renamed to avoid conflicts with legacy CustomerAddress in customer module
 */

export interface CustomerAddressLink {
  id: string;
  customerId: string;
  addressId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  createdDate: Date;
  createdBy?: string;
  updatedDate: Date;
  updatedBy?: string;
  isDeleted: boolean;
}

export interface VendorAddressLink {
  id: string;
  vendorId: string;
  addressId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  createdDate: Date;
  createdBy?: string;
  updatedDate: Date;
  updatedBy?: string;
  isDeleted: boolean;
}

export interface LocationAddressLink {
  id: string;
  locationId: string;
  addressId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  createdDate: Date;
  createdBy?: string;
  updatedDate: Date;
  updatedBy?: string;
  isDeleted: boolean;
}
