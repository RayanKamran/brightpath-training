import type {LocationFormValues} from '../schemas/locationSchema';
import type {
  CreateLocationInput,
  DbLocation,
  LocationAddressRecord,
  LocationContact,
  UpdateLocationInput,
} from '../types/location';

export function buildDefaultValues(location?: DbLocation | null): LocationFormValues {
  if (!location) {
    return {
      name: '',
      displayName: '',
      description: '',
      active: true,
      addresses: [],
      contacts: [],
    };
  }

  return {
    name: location.name,
    displayName: location.displayName ?? '',
    description: location.description ?? '',
    active: location.active,
    addresses: (location.addresses ?? []).map((a) => ({
      type: a.type ?? 'physical',
      isPrimary: a.isPrimary ?? false,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? '',
      locality: a.locality,
      region: a.region ?? '',
      postalCode: a.postalCode ?? '',
      country: a.country || 'US',
      countryName: a.countryName ?? '',
    })),
    contacts: (location.contacts ?? []).map((c) => ({
      type: c.type,
      label: c.label ?? '',
      value: c.value,
    })),
  };
}

function cleanAddresses(addresses: LocationFormValues['addresses']): LocationAddressRecord[] {
  return addresses
    .filter((a) => a.addressLine1.trim() || a.locality.trim())
    .map((a) => ({
      type: a.type || 'physical',
      isPrimary: a.isPrimary ?? false,
      addressLine1: a.addressLine1.trim(),
      addressLine2: a.addressLine2?.trim() || undefined,
      locality: a.locality.trim(),
      region: a.region?.trim() || undefined,
      postalCode: a.postalCode?.trim() || undefined,
      country: a.country.trim() || 'US',
      countryName: a.countryName?.trim() || undefined,
    }));
}

function cleanContacts(contacts: LocationFormValues['contacts']): LocationContact[] {
  return contacts
    .filter((c) => c.value.trim())
    .map((c) => ({
      type: c.type,
      label: c.label?.trim() || undefined,
      value: c.value.trim(),
    }));
}

export function transformToCreatePayload(values: LocationFormValues): CreateLocationInput {
  return {
    name: values.name.trim(),
    displayName: values.displayName?.trim() || undefined,
    description: values.description?.trim() || undefined,
    active: values.active,
    addresses: cleanAddresses(values.addresses),
    contacts: cleanContacts(values.contacts),
  };
}

export function transformToUpdatePayload(values: LocationFormValues): UpdateLocationInput {
  return {
    displayName: values.displayName?.trim() || undefined,
    description: values.description?.trim() || undefined,
    active: values.active,
    addresses: cleanAddresses(values.addresses),
    contacts: cleanContacts(values.contacts),
  };
}
