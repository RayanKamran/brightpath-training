import type {CreateAddressDto, CreateTelcomDto} from '@dms/data-models';

/**
 * Note: The actual Vendor entity only has: id, code, name, locationId
 * Addresses and telcoms are stored separately and linked via junction tables.
 * This seed data includes extra fields for future use.
 */
export type VendorSeedData = {
  id?: string;
  code?: string;
  name?: string;
  terms?: string;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  addresses?: CreateAddressDto[];
  telcoms?: CreateTelcomDto[];
};

export const vendorSeedData: VendorSeedData[] = [
  {
    id: '4e0d0001-0000-4000-8000-000000000001',
    code: 'STAR-OFFICE',
    name: 'Star Office Supply Co.',
    terms: 'Net 30',
    isDeleted: false,
    createdBy: 'system',
    updatedBy: 'system',
    addresses: [
      {
        type: 'physical',
        addressLine1: '1500 Commerce Drive',
        locality: 'Chicago',
        region: 'IL',
        postalCode: '60601',
        country: 'US',
        countryName: 'United States',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000001',
      } as CreateAddressDto,
    ],
    telcoms: [
      {
        type: 'phone',
        subtype: 'work',
        label: 'Main Office',
        address: '+13125551000',
        phoneCountryCode: '+1',
        phoneNationalNumber: '3125551000',
        phoneCountry: 'US',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000001',
      },
      {
        type: 'email',
        subtype: 'work',
        label: 'Sales Contact',
        address: 'sales@techsupplies.com',
        emailVerified: true,
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000001',
      },
      {
        type: 'web',
        subtype: 'corporate',
        label: 'Company Website',
        address: 'https://www.techsupplies.com',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000001',
      },
      {
        type: 'social_media',
        subtype: 'linkedin',
        label: 'LinkedIn Profile',
        address: '@techsupplies',
        socialPlatform: 'linkedin',
        isPrimary: false,
        locationId: '10c00001-0000-4000-8000-000000000001',
      },
    ],
  },
  {
    id: '4e0d0001-0000-4000-8000-000000000002',
    code: 'CLINCHTECH',
    name: 'ClinchTech Systems Inc.',
    terms: 'Net 45',
    isDeleted: false,
    createdBy: 'system',
    updatedBy: 'system',
    addresses: [
      {
        type: 'physical',
        addressLine1: '2500 Tech Parkway',
        locality: 'San Jose',
        region: 'CA',
        postalCode: '95110',
        country: 'US',
        countryName: 'United States',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000002',
      } as CreateAddressDto,
    ],
    telcoms: [
      {
        type: 'phone',
        subtype: 'work',
        label: 'Customer Service',
        address: '+14085552000',
        phoneCountryCode: '+1',
        phoneNationalNumber: '4085552000',
        phoneCountry: 'US',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000002',
      },
    ],
  },
  {
    id: '4e0d0001-0000-4000-8000-000000000003',
    code: 'GREENLIGHT',
    name: 'GreenLight Energy Solutions',
    terms: 'Due on Receipt',
    isDeleted: false,
    createdBy: 'system',
    updatedBy: 'system',
    addresses: [
      {
        type: 'physical',
        addressLine1: '3000 Industrial Way',
        locality: 'Dallas',
        region: 'TX',
        postalCode: '75201',
        country: 'US',
        countryName: 'United States',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000003',
      } as CreateAddressDto,
    ],
    telcoms: [
      {
        type: 'phone',
        subtype: 'work',
        label: 'Main Office',
        address: '+12145551234',
        phoneCountryCode: '+1',
        phoneNationalNumber: '2145551234',
        phoneCountry: 'US',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000003',
      },
    ],
  },
  {
    id: '4e0d0001-0000-4000-8000-000000000004',
    code: 'RELIABLE-FL',
    name: 'Reliable Freight & Logistics',
    terms: 'Net 15',
    isDeleted: false,
    createdBy: 'system',
    updatedBy: 'system',
    addresses: [
      {
        type: 'physical',
        addressLine1: '4500 Manufacturing Blvd',
        locality: 'Detroit',
        region: 'MI',
        postalCode: '48201',
        country: 'US',
        countryName: 'United States',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000004',
      } as CreateAddressDto,
    ],
    telcoms: [
      {
        type: 'email',
        subtype: 'work',
        label: 'Contact Email',
        address: 'info@reliablefreight.com',
        emailVerified: true,
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000004',
      },
    ],
  },
  {
    id: '4e0d0001-0000-4000-8000-000000000005',
    code: 'PRO-SERVICES',
    name: 'Professional Services Group LLC',
    terms: 'Net 30',
    isDeleted: false,
    createdBy: 'system',
    updatedBy: 'system',
    addresses: [
      {
        type: 'physical',
        addressLine1: '5000 Distribution Center',
        locality: 'Atlanta',
        region: 'GA',
        postalCode: '30301',
        country: 'US',
        countryName: 'United States',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000005',
      } as CreateAddressDto,
    ],
    telcoms: [
      {
        type: 'web',
        subtype: 'corporate',
        label: 'Company Website',
        address: 'https://www.proservicesgroup.com',
        isPrimary: true,
        locationId: '10c00001-0000-4000-8000-000000000005',
      },
    ],
  },
];
