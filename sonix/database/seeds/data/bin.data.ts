/**
 * Bins are physical storage locations for parts
 * Uses location names (LOC_AAA, LOC_BBB, etc) which will be resolved to UUIDs by the seeder
 */

type BinSeedData = {
  id: string;
  code: string;
  description: string;
  locationId: string;
};

export const binSeedData: BinSeedData[] = [
  // ========== LOC_AAA Bins ==========
  // Aisle A - Oils & Fluids
  {
    id: '61000000-0000-4000-8000-000000000001',
    code: 'A-12-3',
    description: 'Aisle A, Bay 12, Shelf 3 - Synthetic Oils',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000002',
    code: 'A-12-4',
    description: 'Aisle A, Bay 12, Shelf 4 - Conventional Oils',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000003',
    code: 'A-13-1',
    description: 'Aisle A, Bay 13, Shelf 1 - Transmission Fluids',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000004',
    code: 'A-13-2',
    description: 'Aisle A, Bay 13, Shelf 2 - Coolants',
    locationId: 'LOC_AAA',
  },

  // Aisle B - Filters
  {
    id: '61000000-0000-4000-8000-000000000005',
    code: 'B-05-1',
    description: 'Aisle B, Bay 05, Shelf 1 - Oil Filters',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000006',
    code: 'B-05-2',
    description: 'Aisle B, Bay 05, Shelf 2 - Air Filters',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000007',
    code: 'B-05-3',
    description: 'Aisle B, Bay 05, Shelf 3 - Fuel Filters',
    locationId: 'LOC_AAA',
  },

  // Aisle C - Brakes
  {
    id: '61000000-0000-4000-8000-000000000008',
    code: 'C-08-1',
    description: 'Aisle C, Bay 08, Shelf 1 - Brake Pads',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000009',
    code: 'C-08-2',
    description: 'Aisle C, Bay 08, Shelf 2 - Brake Rotors',
    locationId: 'LOC_AAA',
  },

  // Aisle D - Electrical
  {
    id: '61000000-0000-4000-8000-000000000010',
    code: 'D-01-1',
    description: 'Aisle D, Bay 01, Shelf 1 - Batteries',
    locationId: 'LOC_AAA',
  },
  {
    id: '61000000-0000-4000-8000-000000000011',
    code: 'D-02-2',
    description: 'Aisle D, Bay 02, Shelf 2 - Alternators & Starters',
    locationId: 'LOC_AAA',
  },

  // ========== LOC_BBB Bins ==========
  // Aisle A - Oils & Fluids
  {
    id: '62000000-0000-4000-8000-000000000001',
    code: 'A-12-3',
    description: 'Aisle A, Bay 12, Shelf 3 - Synthetic Oils',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000002',
    code: 'A-12-4',
    description: 'Aisle A, Bay 12, Shelf 4 - Conventional Oils',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000003',
    code: 'A-13-1',
    description: 'Aisle A, Bay 13, Shelf 1 - Transmission Fluids',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000004',
    code: 'A-13-2',
    description: 'Aisle A, Bay 13, Shelf 2 - Coolants',
    locationId: 'LOC_BBB',
  },

  // Aisle B - Filters
  {
    id: '62000000-0000-4000-8000-000000000005',
    code: 'B-05-1',
    description: 'Aisle B, Bay 05, Shelf 1 - Oil Filters',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000006',
    code: 'B-05-2',
    description: 'Aisle B, Bay 05, Shelf 2 - Air Filters',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000007',
    code: 'B-05-3',
    description: 'Aisle B, Bay 05, Shelf 3 - Fuel Filters',
    locationId: 'LOC_BBB',
  },

  // Aisle C - Brakes
  {
    id: '62000000-0000-4000-8000-000000000008',
    code: 'C-08-1',
    description: 'Aisle C, Bay 08, Shelf 1 - Brake Pads',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000009',
    code: 'C-08-2',
    description: 'Aisle C, Bay 08, Shelf 2 - Brake Rotors',
    locationId: 'LOC_BBB',
  },

  // Aisle D - Electrical
  {
    id: '62000000-0000-4000-8000-000000000010',
    code: 'D-01-1',
    description: 'Aisle D, Bay 01, Shelf 1 - Batteries',
    locationId: 'LOC_BBB',
  },
  {
    id: '62000000-0000-4000-8000-000000000011',
    code: 'D-02-2',
    description: 'Aisle D, Bay 02, Shelf 2 - Alternators & Starters',
    locationId: 'LOC_BBB',
  },

  // ========== LOC_HQ Bins ==========
  // Aisle A - Oils & Fluids
  {
    id: '63000000-0000-4000-8000-000000000001',
    code: 'A-12-3',
    description: 'Aisle A, Bay 12, Shelf 3 - Synthetic Oils',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000002',
    code: 'A-12-4',
    description: 'Aisle A, Bay 12, Shelf 4 - Conventional Oils',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000003',
    code: 'A-13-1',
    description: 'Aisle A, Bay 13, Shelf 1 - Transmission Fluids',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000004',
    code: 'A-13-2',
    description: 'Aisle A, Bay 13, Shelf 2 - Coolants',
    locationId: 'LOC_HQ',
  },

  // Aisle B - Filters
  {
    id: '63000000-0000-4000-8000-000000000005',
    code: 'B-05-1',
    description: 'Aisle B, Bay 05, Shelf 1 - Oil Filters',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000006',
    code: 'B-05-2',
    description: 'Aisle B, Bay 05, Shelf 2 - Air Filters',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000007',
    code: 'B-05-3',
    description: 'Aisle B, Bay 05, Shelf 3 - Fuel Filters',
    locationId: 'LOC_HQ',
  },

  // Aisle C - Brakes
  {
    id: '63000000-0000-4000-8000-000000000008',
    code: 'C-08-1',
    description: 'Aisle C, Bay 08, Shelf 1 - Brake Pads',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000009',
    code: 'C-08-2',
    description: 'Aisle C, Bay 08, Shelf 2 - Brake Rotors',
    locationId: 'LOC_HQ',
  },

  // Aisle D - Electrical
  {
    id: '63000000-0000-4000-8000-000000000010',
    code: 'D-01-1',
    description: 'Aisle D, Bay 01, Shelf 1 - Batteries',
    locationId: 'LOC_HQ',
  },
  {
    id: '63000000-0000-4000-8000-000000000011',
    code: 'D-02-2',
    description: 'Aisle D, Bay 02, Shelf 2 - Alternators & Starters',
    locationId: 'LOC_HQ',
  },
];
