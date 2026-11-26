import type {Part} from '../../entities/part.entity';
import {PartStatus} from '../../entities/part.entity';
import {buildPartsSearchEntry} from '../parts-search.index';

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: 'parts/OIL-5W30-QT',
    id2: '',
    partNumber: 'OIL-5W30-QT',
    description: '5W-30 Synthetic Oil 1 Qt',
    vendorPartNumber: 'STR-OIL-5W30-1QT',
    listPrice: {amount: 1299, currency: 'USD'},
    status: PartStatus.Active,
    isDeleted: false,
    totalOnHand: 48,
    totalCommitted: 2,
    totalSpecialOrderCommitted: 0,
    totalOnOrder: 12,
    totalBackordered: 0,
    totalAvailable: 34,
    totalNetAvailable: 34,
    createdDate: new Date('2025-01-01'),
    updatedDate: new Date('2025-01-01'),
    version: 1,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    vendors: [
      {
        vendor: {
          id: 'vendors/STAR-OFFICE',
          vendorNumber: 'STAR-OFFICE',
          name: 'Star Office Supply Co.',
        },
        vendorPartNumber: 'STR-OIL-5W30-1QT',
        isPrimary: true,
        cost: {amount: 645, currency: 'USD'},
      },
    ],
    locations: [
      {
        location: {id: 'locations/LOC_AAA', name: 'LOC_AAA', displayName: 'ACME RV West Coast'},
        numOnHand: 48,
        numCommitted: 2,
        numSpecialOrderCommitted: 0,
        numOnOrder: 12,
        numBackordered: 0,
        numAvailable: 34,
        bins: [
          {
            bin: {id: 'bins/LOC_AAA/A-12-3', binNumber: 'A-12-3', description: 'Aisle A Shelf 3'},
            numOnHand: 30,
            isMain: true,
          },
          {
            bin: {
              id: 'bins/LOC_AAA/B-07-1',
              binNumber: 'B-07-1',
              description: 'Bulk Storage Row B',
            },
            numOnHand: 18,
            isMain: false,
          },
        ],
      },
    ],
    ...overrides,
  } as Part;
}

function queryOf(part: Part): string[] {
  return buildPartsSearchEntry(part).query;
}

describe('buildPartsSearchEntry', () => {
  describe('bin fields — positive (should appear in query)', () => {
    it('includes binNumber for each bin', () => {
      const result = queryOf(makePart());
      expect(result).toContain('A-12-3');
      expect(result).toContain('B-07-1');
    });

    it('includes bin description for each bin', () => {
      const result = queryOf(makePart());
      expect(result).toContain('Aisle A Shelf 3');
      expect(result).toContain('Bulk Storage Row B');
    });

    it('includes bins across multiple locations', () => {
      const part: Part = makePart({
        locations: [
          {
            location: {id: 'locations/LOC_AAA', name: 'LOC_AAA', displayName: 'ACME RV West Coast'},
            numOnHand: 10,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numAvailable: 10,
            numBackordered: 0,
            bins: [
              {
                bin: {id: 'bins/LOC_AAA/A-01-1', binNumber: 'A-01-1', description: 'Aisle A Row 1'},
                numOnHand: 10,
                isMain: true,
              },
            ],
          },
          {
            location: {id: 'locations/LOC_BBB', name: 'LOC_BBB', displayName: 'ACME RV East Coast'},
            numOnHand: 5,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numAvailable: 5,
            numBackordered: 0,
            bins: [
              {
                bin: {
                  id: 'bins/LOC_BBB/Z-99-9',
                  binNumber: 'Z-99-9',
                  description: 'Overflow Zone Z',
                },
                numOnHand: 5,
                isMain: true,
              },
            ],
          },
        ],
      });

      const result = queryOf(part);
      expect(result).toContain('A-01-1');
      expect(result).toContain('Aisle A Row 1');
      expect(result).toContain('Z-99-9');
      expect(result).toContain('Overflow Zone Z');
    });
  });

  describe('bin fields — negative (should not appear or be empty)', () => {
    it('omits bin fields when part has no locations', () => {
      const part: Part = makePart({locations: []});
      const result = queryOf(part);
      expect(result).not.toContain('A-12-3');
      expect(result).not.toContain('Aisle A Shelf 3');
    });

    it('omits bin fields when a location has no bins', () => {
      const part: Part = makePart({
        locations: [
          {
            location: {id: 'locations/LOC_AAA', name: 'LOC_AAA', displayName: 'ACME RV West Coast'},
            numOnHand: 0,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numAvailable: 0,
            numBackordered: 0,
            bins: [],
          },
        ],
      });

      const result: string[] = queryOf(part);
      expect(result).not.toContain('A-12-3');
      expect(result).not.toContain('Aisle A Shelf 3');
    });

    it('uses empty string (not undefined) when binNumber is missing', () => {
      const part: Part = makePart({
        locations: [
          {
            location: {id: 'locations/LOC_AAA', name: 'LOC_AAA'},
            numOnHand: 5,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numAvailable: 5,
            numBackordered: 0,
            bins: [
              {
                bin: {id: 'bins/LOC_AAA/X-00-0', binNumber: undefined as unknown as string},
                numOnHand: 5,
                isMain: true,
              },
            ],
          },
        ],
      });

      const result: string[] = queryOf(part);
      expect(result).not.toContain(undefined);
      expect(result).toContain('');
    });

    it('uses empty string (not undefined) when bin description is missing', () => {
      const part: Part = makePart({
        locations: [
          {
            location: {id: 'locations/LOC_AAA', name: 'LOC_AAA'},
            numOnHand: 5,
            numCommitted: 0,
            numSpecialOrderCommitted: 0,
            numOnOrder: 0,
            numAvailable: 5,
            numBackordered: 0,
            bins: [
              {
                bin: {id: 'bins/LOC_AAA/A-12-3', binNumber: 'A-12-3', description: undefined},
                numOnHand: 5,
                isMain: true,
              },
            ],
          },
        ],
      });

      const result: string[] = queryOf(part);
      expect(result).not.toContain(undefined);
      expect(result).toContain('A-12-3');
    });
  });

  describe('other query fields still present', () => {
    it('still includes partNumber, description, and vendorPartNumber', () => {
      const result: string[] = queryOf(makePart());
      expect(result).toContain('OIL-5W30-QT');
      expect(result).toContain('5W-30 Synthetic Oil 1 Qt');
      expect(result).toContain('STR-OIL-5W30-1QT');
    });

    it('still includes vendor name and vendor number', () => {
      const result: string[] = queryOf(makePart());
      expect(result).toContain('Star Office Supply Co.');
      expect(result).toContain('STAR-OFFICE');
    });

    it('still includes location name and displayName', () => {
      const result: string[] = queryOf(makePart());
      expect(result).toContain('LOC_AAA');
      expect(result).toContain('ACME RV West Coast');
    });
  });

  describe('non-query fields', () => {
    it('sets locationIds from location snapshots', () => {
      const entry = buildPartsSearchEntry(makePart());
      expect(entry.locationIds).toEqual(['locations/LOC_AAA']);
    });

    it('passes through isDeleted and status', () => {
      const entry = buildPartsSearchEntry(makePart({isDeleted: true, status: PartStatus.Retired}));
      expect(entry.isDeleted).toBe(true);
      expect(entry.status).toBe(PartStatus.Retired);
    });
  });
});
