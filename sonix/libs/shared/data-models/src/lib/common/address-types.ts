/**
 * International Address Types
 *
 * Enterprise-grade address types supporting global address formats,
 * geocoding, validation, and analytics.
 *
 * Design Principles:
 * - Support multiple international address formats
 * - Enable geocoding and mapping integration
 * - Provide normalized fields for search and analytics
 * - Support address verification and validation
 * - Allow flexible display formatting
 */

/**
 * Google Maps API types (simplified)
 * Defined locally to avoid dependency on @types/google.maps
 * TODO: consider pullilng in @types/google.maps rather than hard-coding like this
 */
export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeometry {
  location?: {
    lat: () => number;
    lng: () => number;
  };
}

export interface GooglePlaceResult {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  place_id?: string;
  geometry?: GoogleGeometry;
  plus_code?: {
    global_code?: string;
  };
}

/**
 * Address type classification for business logic
 */
export type AddressType =
  | 'billing'
  | 'shipping'
  | 'correspondence'
  | 'physical'
  | 'mailing'
  | 'registered'
  | 'previous'
  | 'alternate';

/**
 * Address verification status
 * Tracks validation state for data quality and compliance
 */
export type AddressVerificationStatus =
  | 'unverified' // Not yet verified
  | 'verified' // Verified by address verification service (e.g., USPS, Canada Post)
  | 'standardized' // Standardized to postal authority format
  | 'corrected' // User address corrected by verification service
  | 'invalid' // Failed verification
  | 'manual' // Manually verified/overridden
  | 'partial'; // Partially verified (some components confirmed)

/**
 * Geocoding accuracy level
 * Indicates precision of latitude/longitude coordinates
 */
export type GeocodingAccuracy =
  | 'rooftop' // Precise building location
  | 'range_interpolated' // Interpolated within address range
  | 'geometric_center' // Geometric center of location (street, city, etc.)
  | 'approximate' // Approximate location
  | 'unknown'; // Accuracy unknown

/**
 * International Address
 *
 * Comprehensive address structure supporting global formats with:
 * - Structured components for programmatic access
 * - Geocoding data for mapping and analytics
 * - Verification metadata for data quality
 * - Search-optimized normalized fields
 *
 * @example
 * ```typescript
 * const usAddress: IntlAddress = {
 *   id: 'addr_12345',
 *   type: 'shipping',
 *   isPrimary: true,
 *   formattedAddress: '123 Main St, Springfield, IL 62701, USA',
 *   line1: '123 Main St',
 *   locality: 'Springfield',
 *   administrativeArea: 'IL',
 *   postalCode: '62701',
 *   countryCode: 'US',
 *   countryName: 'United States',
 *   latitude: 39.7817,
 *   longitude: -89.6501,
 *   isVerified: true,
 *   verificationStatus: 'verified',
 *   createdDate: new Date('2024-01-15T10:00:00Z'),
 *   createdBy: 'system',
 * };
 * ```
 */
export interface IntlAddress {
  // Identification
  id?: string;
  type: AddressType;
  isPrimary: boolean;

  // The 'Formatted Address' is critical for international mail
  // as it handles the correct ordering (e.g., Japan starts with Postal Code)
  formattedAddress: string;

  // Flexible lines for complex addresses (Suite, Floor, Wing, etc.)
  line1: string;
  line2?: string;
  line3?: string;

  // Locality (City / Town / Village)
  locality: string;

  // Sub-Locality (District / Neighborhood / Borough)
  // Crucial for cities like London, NYC, or Tokyo
  subLocality?: string;

  // Administrative Area Level 1 (State / Province / Prefecture / Canton)
  administrativeArea: string;

  // Administrative Area Level 2 (County / Region / Department)
  // Often needed for tax or logistics in Europe/South America
  subAdministrativeArea?: string;

  // International standard for postal codes (can be alphanumeric)
  postalCode?: string;

  // ISO 31166-1 alpha-2 country code (e.g., "DE", "JP", "BR")
  countryCode: string;
  countryName: string;

  // Geospatial
  geospatial: {
    latitude: number;
    longitude: number;
    accuracy: GeocodingAccuracy;
    geocodedDate?: Date; // When geocoding was performed
  };

  // Verification & Validation
  verification: {
    status?: AddressVerificationStatus;
    date?: Date; // When address was last verified
    provider?: string; // Service used (e.g., 'USPS', 'Google', 'SmartyStreets')
  };

  // Search & Analytics
  // Normalized/denormalized fields for efficient querying
  searchableText?: string; // Concatenated, normalized text for full-text search
  normalizedPostalCode?: string; // Standardized format (e.g., '12345' for US)
  geoHash?: string; // Geohash for proximity queries
  plus4?: string; // ZIP+4 extension (US)
  deliveryPoint?: string; // USPS delivery point code

  // Metadata
  // System Metadata
  isActive?: boolean; // Soft delete flag
  validFrom?: Date; // Address valid from date (for historical tracking)
  validTo?: Date; // Address valid until date
  notes?: string; // Special delivery instructions, access codes, etc.
  plusCode?: string; // Google's "Open Location Code" for areas without street names
}

/**
 * Address validation result
 * Returned by address verification services
 */
export interface AddressValidationResult {
  isValid: boolean;
  status: AddressVerificationStatus;
  originalAddress: IntlAddress;
  standardizedAddress?: IntlAddress;
  suggestions?: IntlAddress[];
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Address search criteria for geocoding and validation
 */
export interface AddressSearchCriteria {
  query?: string; // Free-text search
  addressLine1?: string;
  locality?: string;
  subLocality?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  bounds?: {
    // Geographic bounding box for search
    north: number;
    south: number;
    east: number;
    west: number;
  };
  language?: string; // Preferred language for results (ISO 639-1)
  maxResults?: number;
}

// Assuming the IGlobalAddress interface from the previous step is imported

/**
 * Maps Google Maps API Address Components to our IGlobalAddress interface.
 * Handles variations in international address structures.
 */
export function parseGooglePlace(place: GooglePlaceResult): IntlAddress {
  const components = place.address_components || [];

  // Helper to find specific types in the Google components array
  const getComponent = (type: string, useShortName = false): string => {
    const comp = components.find((c) => c.types.includes(type));
    return comp ? (useShortName ? comp.short_name : comp.long_name) : '';
  };

  // 1. Construct Line 1 (Street Number + Route)
  const streetNumber = getComponent('street_number');
  const route = getComponent('route');
  const line1 = `${streetNumber} ${route}`.trim();

  // Determine geocoding accuracy
  const lat = place.geometry?.location?.lat() || 0;
  const lng = place.geometry?.location?.lng() || 0;
  const hasGeometry = !!place.geometry;

  // 2. Build the mapped object
  return {
    type: 'physical',
    isPrimary: false,
    formattedAddress: place.formatted_address || '',

    line1: line1 || getComponent('establishment') || 'Address not found',
    line2: getComponent('subpremise'), // e.g., "Apt 4B"

    locality: getComponent('locality') || getComponent('postal_town'),
    subLocality: getComponent('sublocality_level_1'),

    administrativeArea: getComponent('administrative_area_level_1', true), // "NY", "ON"
    subAdministrativeArea: getComponent('administrative_area_level_2'), // "Kings County"

    postalCode: getComponent('postal_code'),
    countryCode: getComponent('country', true), // ISO Alpha-2 (e.g., "US")
    countryName: getComponent('country'), // "United States"

    geospatial: {
      latitude: lat,
      longitude: lng,
      accuracy: hasGeometry ? 'rooftop' : 'unknown',
      geocodedDate: new Date(),
    },

    verification: {
      status: hasGeometry && place.place_id ? 'verified' : 'unverified',
      date: new Date(),
      provider: 'Google',
    },

    plusCode: place.plus_code?.global_code || '',
    isActive: true,
  };
}
