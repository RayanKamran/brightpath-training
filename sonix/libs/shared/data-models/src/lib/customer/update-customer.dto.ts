import type {CreditCardSummary, EmailAddress, IntlPhoneNumber} from '../common/index.js';
import type {CustomerUnit, CustomerWants} from './customer.interface.js';

/**
 * DTO for updating an existing customer
 * All fields optional except id which must be in the path
 */
export class UpdateCustomerDto {
  // Basic information
  salutation?: string;
  firstName?: string;
  surname?: string;
  suffix?: string;
  greeting?: string;
  entityName?: string;

  // Contact information
  phones?: IntlPhoneNumber[];
  emails?: EmailAddress[];

  // Demographics
  birthDate?: Date;
  ssn?: string;
  driversLicenseNumber?: string;
  driversLicenseState?: string;
  driversLicenseExpiry?: Date;
  occupation?: string;
  spouseName?: string;
  anniversary?: Date;
  childrenNames?: string[];

  // Business relationships
  locationId?: string;
  salesRepId?: string;
  salesRepPercentage?: number;
  salesRepAssignedDate?: Date;

  // Credit & billing
  creditLimit?: number;
  termsDescription?: string;
  daysAllowed?: number;
  taxExemptNumber?: string;
  taxCode?: string;
  discountPercentage?: number;
  allowChargeSales?: boolean;
  allowServiceCharges?: boolean;
  chargeAccountNumber?: string;
  creditCards?: CreditCardSummary[];

  // Status & preferences
  status?: 'active' | 'inactive' | 'prospect' | 'lead';
  inactive?: boolean;
  inactiveDate?: Date;
  inactiveComments?: string;
  source?: string;
  sourceDetail?: string;
  referredBy?: string;
  leadId?: string;

  // Communication preferences
  preferredContactMethod?: 'phone' | 'email' | 'text' | 'mail';
  correspondenceLanguage?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  doNotText?: boolean;
  doNotMail?: boolean;
  doNotBulkEmail?: boolean;
  doNotBulkMail?: boolean;

  // CRM & sales
  followUpDate?: Date;
  nextContactDate?: Date;
  lastContactDate?: Date;
  lastContactInfo?: string;
  grade?: string;
  prospectType?: string;
  dealStatus?: string;

  // Inventory relationships
  units?: CustomerUnit[];
  wants?: CustomerWants[];

  // Marketing
  emailMarketingId?: string;
  emailMarketingStatus?: string;
  emailMarketingMessagePreference?: string;

  // Intercompany & multi-location

  linkedCustomerIds?: string[];
  coOwnerId?: string;

  // User-defined fields
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;

  // Version for optimistic locking
  version?: number;
}
