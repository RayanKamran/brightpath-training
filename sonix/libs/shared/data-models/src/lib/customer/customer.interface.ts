/**
 * Customer Domain Models
 *
 * Optimized from legacy 320-column MSSQL schema to normalized TypeScript structure.
 * Uses composition pattern with embedded objects instead of separate related tables.
 */

import type {
  CreditCardSummary,
  DmsBaseEntity,
  EmailAddress,
  IntlPhoneNumber,
} from '../common/index.js';

/**
 * Unit the customer has (current ownership)
 */
export interface CustomerUnit {
  id?: string;
  stockNumber?: string;
  unitType?: string;
  brand?: string;
  model?: string;
  modelYear?: number;
  serialNumber?: string;
  chassisNumber?: string;
  length?: number;
  value?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  soldDate?: Date;
  stillOwns: boolean;
  description?: string;
}

/**
 * Unit the customer wants (prospecting/interest)
 */
export interface CustomerWants {
  id?: string;
  unitType?: string;
  brand?: string;
  model?: string;
  modelYearFrom?: number;
  modelYearTo?: number;
  sizeFrom?: number;
  sizeTo?: number;
  priceFrom?: number;
  priceTo?: number;
  layout?: string;
  engine?: string;
  designation?: string;
  comments?: string;
}

/**
 * Core Customer entity
 */
export interface Customer extends DmsBaseEntity {
  // Basic Information
  salutation?: string;
  firstName: string;
  surname: string;
  suffix?: string;
  greeting?: string;
  entityName?: string; // For business entities

  // Contact Information (embedded arrays)
  phones: IntlPhoneNumber[];
  emails: EmailAddress[];

  // Demographics
  birthDate?: Date;
  ssn?: string; // Should be encrypted in production
  driversLicenseNumber?: string;
  driversLicenseState?: string;
  driversLicenseExpiry?: Date;
  occupation?: string;
  spouseName?: string;
  anniversary?: Date;
  childrenNames?: string[];

  // Business Relationships
  locationId: string; // The location (rooftop) this customer belongs to
  salesRepId?: string;
  salesRepPercentage?: number;
  salesRepAssignedDate?: Date;

  // Credit & Billing
  creditLimit?: number;
  termsDescription?: string;
  daysAllowed?: number;
  taxExemptNumber?: string;
  taxCode?: string;
  discountPercentage?: number;
  allowChargeSales: boolean;
  allowServiceCharges: boolean;
  chargeAccountNumber?: string;
  creditCards?: CreditCardSummary[];

  // Status & Preferences
  status: 'active' | 'inactive' | 'prospect' | 'lead';
  inactive: boolean;
  inactiveDate?: Date;
  inactiveComments?: string;
  source?: string;
  sourceDetail?: string;
  referredBy?: string;
  leadId?: string;

  // Communication Preferences
  preferredContactMethod?: 'phone' | 'email' | 'text' | 'mail';
  correspondenceLanguage?: string;
  doNotCall: boolean;
  doNotEmail: boolean;
  doNotText: boolean;
  doNotMail: boolean;
  doNotBulkEmail: boolean;
  doNotBulkMail: boolean;

  // CRM & Sales
  followUpDate?: Date;
  nextContactDate?: Date;
  lastContactDate?: Date;
  lastContactInfo?: string;
  grade?: string;
  prospectType?: string;
  dealStatus?: string;

  // Inventory Relationships (denormalized for performance)
  units?: CustomerUnit[]; // Units they currently own
  wants?: CustomerWants[]; // Units they're interested in

  // Marketing
  emailMarketingId?: string;
  emailMarketingStatus?: string;
  emailMarketingMessagePreference?: string;

  // Intercompany & Multi-Location
  linkedCustomerIds?: string[];
  coOwnerId?: string;

  // User-Defined Fields
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;

  // Audit Fields (legacy time fields)
  createdTime?: string;
  updatedTime?: string;

  // Security
  securityControl?: string;
  ownerId?: string;
  ownerTeam?: string;
  ownerDistrict?: string;
  ownerRegion?: string;

  // Legacy/Migration Fields
  legacyId?: string;
  migrationOriginalId?: string;
  releaseNumber?: string;
  patchNumber?: string;
}

/**
 * Customer list item (minimal fields for list views)
 */
export interface CustomerListItem {
  id: string;
  firstName: string;
  surname: string;
  entityName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  city?: string;
  state?: string;
  status: string;
  lastContactDate?: Date;
  salesRepId?: string;
  createdDate: Date;
}

/**
 * Customer search/filter criteria
 */
export interface CustomerSearchCriteria {
  searchTerm?: string; // Search across name, email, phone
  status?: string[];
  locationName?: string;
  salesRepId?: string;
  createdDateFrom?: Date;
  createdDateTo?: Date;
  lastContactDateFrom?: Date;
  lastContactDateTo?: Date;
  followUpDateFrom?: Date;
  followUpDateTo?: Date;
  hasActiveUnits?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated customer list response
 */
export interface CustomerListResponse {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
