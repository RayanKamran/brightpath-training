/**
 * This file contains seed data for the Unit of Measurement (UOM) entity. Each entry includes a unique ID, a code representing the unit of measurement, and a description of the unit. This data can be used to populate the database with common units of measurement for parts and inventory management.
 * The UOM codes and descriptions are based on standard units commonly used in manufacturing, inventory, and supply chain contexts.
 * The IDs are generated as UUIDs and should be unique across the database. The codes are short, standardized abbreviations for the units, while the descriptions provide a more human-readable explanation of each unit.
 **/

export type UomSeedData = {
  id: string;
  code: string;
  description: string;
};

export const unitOfMeasurementSeedData: UomSeedData[] = [
  {
    id: '72000000-0000-4000-8000-000000000010',
    code: 'EA',
    description: 'Each',
  },
  {
    id: '72000000-0000-4000-8000-000000000011',
    code: 'LB',
    description: 'Pound',
  },
  {
    id: '72000000-0000-4000-8000-000000000012',
    code: 'PR',
    description: 'Pair',
  },
  {
    id: '72000000-0000-4000-8000-000000000001',
    code: 'KG',
    description: 'Kilogram',
  },
  {
    id: '72000000-0000-4000-8000-000000000002',
    code: 'L',
    description: 'Liter',
  },
  {
    id: '72000000-0000-4000-8000-000000000003',
    code: 'ML',
    description: 'Milliliter',
  },
  {
    id: '72000000-0000-4000-8000-000000000004',
    code: 'GAL',
    description: 'Gallon',
  },
  {
    id: '72000000-0000-4000-8000-00000000000A',
    code: 'G',
    description: 'Gram',
  },
  {
    id: '72000000-0000-4000-8000-000000000005',
    code: 'OZ',
    description: 'Ounce',
  },
  {
    id: '72000000-0000-4000-8000-000000000006',
    code: 'PCs',
    description: 'Pieces',
  },
  {
    id: '72000000-0000-4000-8000-000000000007',
    code: 'FT',
    description: 'Feet',
  },
  {
    id: '72000000-0000-4000-8000-000000000008',
    code: 'IN',
    description: 'Inch',
  },
  {
    id: '72000000-0000-4000-8000-000000000009',
    code: 'M',
    description: 'Meter',
  },
  {
    id: '72000000-0000-4000-8000-00000000000F',
    code: 'Set',
    description: 'Set',
  },
  {
    id: '72000000-0000-4000-8000-00000000000B',
    code: 'YD',
    description: 'Yard',
  },
  {
    id: '72000000-0000-4000-8000-00000000000C',
    code: 'BOX',
    description: 'Box',
  },
  {
    id: '72000000-0000-4000-8000-00000000000D',
    code: 'PKG',
    description: 'Package',
  },
  {
    id: '72000000-0000-4000-8000-00000000000E',
    code: 'QT',
    description: 'Quart',
  },
];
