import type {EmailAddress, IntlPhoneNumber} from '../common/index.js';

/**
 * DTO for creating a new customer
 * Contains minimal required fields and commonly used optional fields
 */
export class CreateCustomerDto {
  // Required fields
  firstName!: string;
  surname!: string;
  locationNames!: string[];

  // Common optional fields
  salutation?: string;
  suffix?: string;
  greeting?: string;
  entityName?: string;

  // Contact information
  phones?: IntlPhoneNumber[];
  emails?: EmailAddress[];

  // Demographics
  birthDate?: Date;
  driversLicenseNumber?: string;
  driversLicenseState?: string;
  driversLicenseExpiry?: Date;
  occupation?: string;
  spouseName?: string;

  // Business relationships
  salesRepId?: string;

  // Status & preferences
  status?: 'active' | 'inactive' | 'prospect' | 'lead';
  source?: string;
  sourceDetail?: string;
  referredBy?: string;
  leadId?: string;

  // Communication preferences
  preferredContactMethod?: 'phone' | 'email' | 'text' | 'mail';
  doNotCall?: boolean;
  doNotEmail?: boolean;
  doNotText?: boolean;
  doNotMail?: boolean;

  // CRM
  followUpDate?: Date;
  nextContactDate?: Date;

  // User-defined fields
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}
