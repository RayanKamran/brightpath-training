/**
 * International Phone Number Types
 *
 * Enterprise-grade phone number types supporting E.164 standard,
 * international formats, validation, SMS capabilities, and carrier information.
 *
 * Standards:
 * - E.164: International phone number format (+[country][number])
 * - ITU-T E.164: Up to 15 digits including country code
 * - RFC 3966: tel: URI scheme
 * - libphonenumber: Google's phone number parsing/formatting library
 */

/**
 * Phone number type classification
 */
export type PhoneNumberType =
  | 'fax' // Fax number
  | 'home' // Home phone
  | 'landline' // Fixed-line phone
  | 'mobile' // Mobile/cellular phone
  | 'pager' // Pager number
  | 'personal' // Personal number service
  | 'premium-rate' // Premium rate number
  | 'shared-cost' // Shared cost number
  | 'toll-free' // Toll-free number (800, 888, etc.)
  | 'uan' // Universal Access Number
  | 'voicemail' // Voicemail access number
  | 'voip' // VoIP number (Skype, WhatsApp, etc.)
  | 'work' // Business/work phone
  | 'other'; // Other/unknown type

/**
 * Phone number verification status
 */
export type PhoneNumberVerificationStatus =
  | 'expired' // Verification expired
  | 'invalid' // Failed verification
  | 'manual' // Manually verified/overridden
  | 'pending' // Verification pending
  | 'unverified' // Not yet verified
  | 'verified'; // Verified via SMS or call

/**
 * Phone number capability flags
 */
export interface PhoneNumberCapabilities {
  /** Can receive voice calls */
  voice?: boolean;
  /** Can receive SMS messages */
  sms?: boolean;
  /** Can receive MMS messages */
  mms?: boolean;
  /** Can receive fax */
  fax?: boolean;
  /** Supports call forwarding */
  callForwarding?: boolean;
  /** Supports voicemail */
  voicemail?: boolean;
}

/**
 * Carrier/operator information
 */
export interface PhoneNumberCarrier {
  /** Carrier/operator name */
  name?: string;
  /** Carrier type (mobile, landline, voip) */
  type?: 'mobile' | 'landline' | 'voip' | 'unknown';
  /** Mobile Country Code (MCC) */
  mcc?: string;
  /** Mobile Network Code (MNC) */
  mnc?: string;
  /** Country of carrier */
  country?: string;
}

/**
 * Phone number verification details
 */
export interface PhoneNumberVerificationDetails {
  /** Verification method used */
  method?: 'sms' | 'voice' | 'whatsapp' | 'manual';
  /** Verification code sent (for audit) */
  codeSent?: string;
  /** Number of verification attempts */
  attempts?: number;
  /** Last verification attempt timestamp */
  lastAttempt?: Date;
  /** Verification expiry date */
  expiresAt?: Date;
  /** Verification provider (Twilio, AWS SNS, etc.) */
  provider?: string;
}

/**
 * International phone number interface
 *
 * Comprehensive phone number type supporting E.164 format,
 * international validation, carrier lookup, and SMS capabilities.
 */
export interface IntlPhoneNumber {
  // Identification
  /** Unique identifier */
  id?: string;
  /** Phone number type classification */
  type: PhoneNumberType;
  /** Optional label (e.g., "Main Office", "Emergency Contact") */
  label?: string;
  /** Primary phone number flag */
  isPrimary?: boolean;

  // E.164 Format (Canonical)
  /**
   * E.164 format: +[country code][subscriber number]
   * Example: +14155552671 (US), +442071838750 (UK), +81312345678 (Japan)
   * Max 15 digits including country code (no spaces, dashes, or parentheses)
   */
  e164: string;

  // Structured Components
  /**
   * Country calling code (with + prefix)
   * Examples: +1 (US/Canada), +44 (UK), +81 (Japan), +86 (China)
   */
  countryCode: string;

  /**
   * National number (without country code)
   * Example: 4155552671 for US number
   */
  nationalNumber: string;

  /**
   * Extension or additional digits
   * Example: "1234" for corporate phone systems
   */
  extension?: string;

  /**
   * ISO 3166-1 alpha-2 country code
   * Example: "US", "GB", "JP", "CA"
   */
  country: string;

  /**
   * Country name (human-readable)
   * Example: "United States", "United Kingdom", "Japan"
   */
  countryName?: string;

  // Display Formats
  /**
   * International format (for display)
   * Example: +1 415-555-2671, +44 20 7183 8750
   */
  international?: string;

  /**
   * National format (local format for country)
   * Example: (415) 555-2671 (US), 020 7183 8750 (UK)
   */
  national?: string;

  /**
   * RFC 3966 format (tel: URI)
   * Example: tel:+1-415-555-2671;ext=1234
   */
  rfc3966?: string;

  // Capabilities & Classification
  /**
   * Phone number capabilities (SMS, voice, MMS, etc.)
   */
  capabilities?: PhoneNumberCapabilities;

  /**
   * Carrier/operator information
   */
  carrier?: PhoneNumberCarrier;

  // Verification & Validation
  /**
   * Verification status
   */
  verificationStatus?: PhoneNumberVerificationStatus;

  /**
   * Date when phone number was verified
   */
  verificationDate?: Date;

  /**
   * Verification details
   */
  verificationDetails?: PhoneNumberVerificationDetails;

  /**
   * Whether number is valid according to libphonenumber
   */
  isValid?: boolean;

  /**
   * Whether number is possible (length check only)
   */
  isPossible?: boolean;

  // Search & Reporting
  /**
   * Normalized number for searching (digits only, no formatting)
   * Example: "14155552671"
   */
  searchableDigits?: string;

  /**
   * Last 4 digits for partial display/search
   * Example: "2671"
   */
  last4?: string;

  /**
   * Area code or geographic region code
   * Example: "415" (San Francisco), "020" (London)
   */
  areaCode?: string;

  /**
   * Time zone(s) associated with phone number
   * Can be multiple for countries with multiple zones
   * IANA timezone format: "America/Los_Angeles"
   */
  timeZones?: string[];

  // Usage & Preferences
  /**
   * Preferred time to call (for outbound calling)
   */
  preferredCallTime?: {
    start?: string; // Time in HH:mm format
    end?: string; // Time in HH:mm format
    timezone?: string; // IANA timezone
  };

  /**
   * Do Not Call flag (regulatory compliance)
   */
  doNotCall?: boolean;

  /**
   * Can send marketing/promotional messages
   */
  marketingConsent?: boolean;

  /**
   * Can send transactional/service messages
   */
  transactionalConsent?: boolean;

  /**
   * Consent date for legal compliance
   */
  consentDate?: Date;

  // Metadata
  /**
   * Free-form notes about this phone number
   */
  notes?: string;

  /**
   * Active status (soft delete support)
   */
  isActive?: boolean;

  /**
   * When this phone number became effective
   */
  validFrom?: Date;

  /**
   * When this phone number expires/expired
   */
  validTo?: Date;

  /**
   * Cost center or department (for corporate numbers)
   */
  costCenter?: string;

  // Audit Trail
  /**
   * When this record was created
   */
  createdDate?: Date;

  /**
   * When this record was last updated
   */
  updatedDate?: Date;

  /**
   * User who created this record
   */
  createdBy?: string;

  /**
   * User who last updated this record
   */
  updatedBy?: string;
}

/**
 * Simplified phone number for basic use cases
 */
export interface SimplePhoneNumber {
  /** Phone number with country code */
  number: string;
  /** Phone type */
  type?: 'mobile' | 'work' | 'home' | 'other';
  /** Extension */
  extension?: string;
  /** Primary flag */
  isPrimary?: boolean;
}

/**
 * Phone number validation result
 */
export interface PhoneNumberValidationResult {
  /** Whether validation was successful */
  isValid: boolean;
  /** Whether number is possible (basic length check) */
  isPossible: boolean;
  /** E.164 formatted number */
  e164?: string;
  /** International format */
  international?: string;
  /** National format */
  national?: string;
  /** Country code */
  countryCode?: string;
  /** National number */
  nationalNumber?: string;
  /** Detected country */
  country?: string;
  /** Number type detected */
  numberType?: PhoneNumberType;
  /** Carrier information */
  carrier?: PhoneNumberCarrier;
  /** Validation error message */
  error?: string;
  /** Validation warnings */
  warnings?: string[];
}

/**
 * Phone number parsing result
 */
export interface PhoneNumberParseResult {
  /** Whether parsing was successful */
  success: boolean;
  /** Parsed phone number */
  phoneNumber?: IntlPhoneNumber;
  /** Parse error message */
  error?: string;
  /** Original input */
  originalInput: string;
  /** Assumed country for parsing (if provided) */
  defaultCountry?: string;
}

/**
 * Phone number formatting options
 */
export interface PhoneNumberFormatOptions {
  /** Format type */
  format: 'e164' | 'international' | 'national' | 'rfc3966';
  /** Include extension in output */
  includeExtension?: boolean;
  /** Country code for national formatting */
  country?: string;
}

/**
 * Phone number search criteria
 */
export interface PhoneNumberSearchCriteria {
  /** Search by digits (partial or complete) */
  digits?: string;
  /** Search by country */
  country?: string;
  /** Search by area code */
  areaCode?: string;
  /** Search by type */
  type?: PhoneNumberType;
  /** Search by carrier */
  carrier?: string;
  /** Include only verified numbers */
  verifiedOnly?: boolean;
  /** Include only SMS-capable numbers */
  smsCapable?: boolean;
  /** Include only active numbers */
  activeOnly?: boolean;
}

/**
 * Bulk phone number validation request
 */
export interface BulkPhoneNumberValidationRequest {
  /** Phone numbers to validate */
  phoneNumbers: Array<{
    number: string;
    defaultCountry?: string;
    id?: string;
  }>;
  /** Include carrier lookup */
  includeCarrier?: boolean;
  /** Include timezone lookup */
  includeTimezone?: boolean;
}

/**
 * Bulk phone number validation response
 */
export interface BulkPhoneNumberValidationResponse {
  /** Validation results */
  results: Array<PhoneNumberValidationResult & {id?: string}>;
  /** Total processed */
  total: number;
  /** Valid count */
  validCount: number;
  /** Invalid count */
  invalidCount: number;
  /** Processing time (ms) */
  processingTime?: number;
}
