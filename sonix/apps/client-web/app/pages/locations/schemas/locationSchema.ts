import * as v from 'valibot';

const addressSchema = v.object({
  type: v.optional(v.string()),
  isPrimary: v.optional(v.boolean()),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  locality: v.string(),
  region: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  country: v.pipe(v.string(), v.minLength(1, 'Country is required')),
  countryName: v.optional(v.string()),
});

const contactSchema = v.object({
  type: v.picklist(['phone', 'email', 'web'] as const),
  label: v.optional(v.string()),
  value: v.pipe(v.string(), v.minLength(1, 'Contact value is required')),
});

export const locationCreateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  displayName: v.optional(v.string()),
  description: v.optional(v.string()),
  active: v.boolean(),
  addresses: v.array(addressSchema),
  contacts: v.array(contactSchema),
});

export const locationUpdateSchema = v.object({
  name: v.string(), // Read-only on edit — not validated
  displayName: v.optional(v.string()),
  description: v.optional(v.string()),
  active: v.boolean(),
  addresses: v.array(addressSchema),
  contacts: v.array(contactSchema),
});

export type LocationFormValues = v.InferOutput<typeof locationCreateSchema>;
