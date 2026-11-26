import * as v from 'valibot';

/** Empty input means "not given"; otherwise a number of 0 or more. */
const optionalAmount = v.union([
  v.literal(''),
  v.pipe(v.string(), v.regex(/^\d+(\.\d+)?$/, 'Must be a number of 0 or more')),
]);

const vendorSchema = v.object({
  vendorNumber: v.pipe(v.string(), v.trim(), v.minLength(1, 'Vendor # is required')),
  vendorPartNumber: v.string(),
  isPrimary: v.boolean(),
  cost: optionalAmount,
});

/**
 * Create Part form. Mirrors the API rules (docs/features/parts/part-create.md): Part ID format,
 * description required, at least one vendor, maxQty >= minQty, shippingUnit when weight > 0.
 */
export const partCreateSchema = v.pipe(
  v.object({
    partNumber: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, 'Part ID is required'),
      v.maxLength(50, 'Part ID is at most 50 characters'),
      v.regex(/^[A-Za-z0-9._-]+$/, 'Use only letters, numbers, hyphens, dots and underscores'),
    ),
    description: v.pipe(v.string(), v.trim(), v.minLength(1, 'Description is required')),
    status: v.string(),
    listPrice: optionalAmount,
    priceGroup: v.string(),
    glGroup: v.string(),
    taxCode: v.string(),
    sellUom: v.string(),
    purchaseUom: v.string(),
    salePurchaseRatio: optionalAmount,
    shippingWeight: optionalAmount,
    shippingUnit: v.string(),
    caseQty: optionalAmount,
    minQty: optionalAmount,
    maxQty: optionalAmount,
    minDays: optionalAmount,
    minOrder: optionalAmount,
    onHandQty: optionalAmount,
    pogNumber: v.pipe(v.string(), v.maxLength(8, 'POG # is at most 8 characters')),
    popCode: v.string(),
    comments: v.string(),
    bypassPriceUpdate: v.boolean(),
    serialized: v.boolean(),
    vendors: v.pipe(v.array(vendorSchema), v.minLength(1, 'At least one vendor is required')),
  }),
  v.forward(
    v.check(
      (f) => f.minQty === '' || f.maxQty === '' || Number(f.maxQty) >= Number(f.minQty),
      'Max qty must be at least min qty',
    ),
    ['maxQty'],
  ),
  v.forward(
    v.check(
      (f) =>
        f.shippingWeight === '' || Number(f.shippingWeight) === 0 || f.shippingUnit.trim() !== '',
      'Shipping unit is required when there is a shipping weight',
    ),
    ['shippingUnit'],
  ),
);

export type PartFormValues = v.InferInput<typeof partCreateSchema>;
