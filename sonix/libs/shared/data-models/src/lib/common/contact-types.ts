/**
 * Common Contact Types
 * Shared across multiple entities (Customer, Vendor, etc.)
 */

/**
 * Phone number with type classification
 */
export interface PhoneNumber {
  id?: string;
  type: 'home' | 'work' | 'cell' | 'fax' | 'other';
  number: string;
  extension?: string;
  department?: string;
  isPrimary?: boolean;
}

/**
 * Email address with type classification
 */
export interface EmailAddress {
  id?: string;
  type: 'personal' | 'work' | 'other';
  address: string;
  isPrimary?: boolean;
}
