/**
 * Telcom Type Enum
 */
export type TelcomType = 'phone' | 'email' | 'social_media' | 'web' | 'fax' | 'sms';

/**
 * Social Media Platform Enum
 */
export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'github'
  | 'other';

/**
 * Telcom Interface
 */
export interface Telcom {
  id: string;
  type: TelcomType;
  subtype?: string;
  label?: string;

  // Universal address field
  address?: string;

  // Phone supplementary fields
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  phoneExtension?: string;
  phoneCountry?: string;

  // Email supplementary fields
  emailVerified: boolean;
  emailVerifiedDate?: Date;

  // Social Media supplementary fields
  socialPlatform?: SocialPlatform;

  // Web supplementary fields
  webType?: string;

  // Priority
  isPrimary: boolean;
  displayOrder: number;
  isActive: boolean;

  // Temporal
  validFrom?: Date;
  validTo?: Date;

  // Metadata
  notes?: string;
  locationId?: string;

  // Audit fields from DmsBaseClass
  createdDate: Date;
  createdBy: string;
  updatedDate: Date;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
}

/**
 * Create Telcom DTO
 */
export interface CreateTelcomDto {
  type: TelcomType;
  subtype?: string;
  label?: string;
  address?: string;
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  phoneExtension?: string;
  phoneCountry?: string;
  emailVerified?: boolean;
  socialPlatform?: SocialPlatform;
  webType?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  locationId?: string;
}

/**
 * Update Telcom DTO
 */
export interface UpdateTelcomDto extends Partial<CreateTelcomDto> {}

/**
 * Telcom Search Criteria
 */
export interface TelcomEntitySearchCriteria {
  type?: TelcomType;
  subtype?: string;
  address?: string;
  socialPlatform?: SocialPlatform;
  isActive?: boolean;
  isPrimary?: boolean;
  locationId?: string;
}

/**
 * CustomerTelcom Junction Interface
 */
export interface CustomerTelcomLink {
  id: string;
  customerId: string;
  telcomId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  isDeleted: boolean;
  createdBy: string;
}

/**
 * VendorTelcom Junction Interface
 */
export interface VendorTelcomLink {
  id: string;
  vendorId: string;
  telcomId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  isDeleted: boolean;
  createdBy: string;
}

/**
 * LocationTelcom Junction Interface
 */
export interface LocationTelcomLink {
  id: string;
  locationId: string;
  telcomId: string;
  isPrimary: boolean;
  displayOrder: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  isDeleted: boolean;
  createdBy: string;
}
