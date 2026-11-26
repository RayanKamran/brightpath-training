import * as v from 'valibot';
import {describe, expect, it} from 'vitest';
import {
  buildDefaultValues,
  transformToCreatePayload,
} from '../../app/pages/parts/mappers/partFormMapper';
import {type PartFormValues, partCreateSchema} from '../../app/pages/parts/schemas/partSchema';

const valid = (overrides: Partial<PartFormValues> = {}): PartFormValues => ({
  ...buildDefaultValues(),
  partNumber: 'BRK-1',
  description: 'Brake pad',
  vendors: [{vendorNumber: 'V1', vendorPartNumber: '', isPrimary: true, cost: '12.99'}],
  ...overrides,
});

const issuesFor = (values: PartFormValues): string[] =>
  (v.safeParse(partCreateSchema, values).issues ?? []).map((i) => v.getDotPath(i) ?? '_form');

describe('create part form', () => {
  it('defaults sales/purchase UOM to EA, ratio to 1 and status to active', () => {
    const d = buildDefaultValues();
    expect([d.sellUom, d.purchaseUom, d.salePurchaseRatio, d.status]).toEqual([
      'EA',
      'EA',
      '1',
      'active',
    ]);
  });

  it('accepts a minimal valid part', () => {
    expect(issuesFor(valid())).toEqual([]);
  });

  it('requires Part ID, description and at least one vendor', () => {
    expect(issuesFor(valid({partNumber: '', description: '', vendors: []}))).toEqual(
      expect.arrayContaining(['partNumber', 'description', 'vendors']),
    );
  });

  it('rejects Part IDs outside letters, numbers, - . _', () => {
    expect(issuesFor(valid({partNumber: 'BRK 1'}))).toContain('partNumber');
    expect(issuesFor(valid({partNumber: 'A'.repeat(51)}))).toContain('partNumber');
  });

  it('enforces max >= min and a shipping unit when there is a weight', () => {
    expect(issuesFor(valid({minQty: '5', maxQty: '2'}))).toContain('maxQty');
    expect(issuesFor(valid({shippingWeight: '3', shippingUnit: ''}))).toContain('shippingUnit');
    expect(issuesFor(valid({shippingWeight: '0', shippingUnit: ''}))).toEqual([]);
  });

  it('sends money as cents and leaves out empty optional fields', () => {
    const payload = transformToCreatePayload(valid({listPrice: '19.99'}), 'LOC_AAA');
    expect(payload.listPrice).toBe(1999);
    expect(payload.vendors[0]).toEqual({vendorNumber: 'V1', isPrimary: true, cost: 1299});
    expect(payload.locationId).toBe('LOC_AAA');
    expect('minQty' in payload).toBe(false);
    expect('pogNumber' in payload).toBe(false);
  });
});
