import type {CurrencyCode} from '@dms/data-models';
import {DmsBaseEntity} from '../../common/entities/dms-base.entity';

export type LocationAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export type LocationAddressRecord = {
  type?: string;
  isPrimary?: boolean;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  region?: string;
  postalCode?: string;
  country: string;
  countryName?: string;
  locationId?: string;
};

export type LocationContact = {
  type: 'phone' | 'email' | 'web';
  label?: string;
  value: string;
};

/**
 * Location Entity
 *
 * Represents physical locations/rooftops/branches in the DMS system
 * Stores local database representation, synchronized from Logto organizations
 * Used for multi-tenant data scoping across customers, vendors, and other entities
 * Extends DmsBaseClass for common audit and soft-delete functionality
 */
export class Location extends DmsBaseEntity {
  public name!: string;

  public displayName?: string;

  public logtoId?: string;

  public description?: string;

  public address?: LocationAddress;

  public addresses?: LocationAddressRecord[];

  public contacts?: LocationContact[];

  public active!: boolean;

  /** ISO 4217 currency code used as the default for all monetary values at this location. */
  public defaultCurrency?: CurrencyCode;
}
