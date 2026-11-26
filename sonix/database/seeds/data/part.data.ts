/**
 * Part seed data — aligned to the new embedded-aggregate Part model.
 *
 * Each part carries:
 *   vendors[]  — one or more PartVendor entries with embedded VendorSnapshot.
 *                Exactly one must have isPrimary = true.
 *   locations[] — one or more PartLocation entries with embedded LocationSnapshot,
 *                 per-bin stock, and computed numOnHand / numAvailable.
 *
 * Rollup fields (totalOnHand etc.) are computed by the seed runner from the locations array.
 * All monetary values are Money objects {amount (cents), currency}.
 */

type MoneyValue = {amount: number; currency: string};

export type PartVendorSeedEntry = {
  vendorCode: string; // maps to vendors/{vendorCode}
  vendorPartNumber?: string;
  isPrimary: boolean;
  cost?: MoneyValue;
};

export type LocationBinSeedEntry = {
  binCode: string; // maps to bins/{locationName}/{binCode}
  numOnHand: number;
};

export type PartLocationSeedEntry = {
  locationName: string; // maps to locations/{locationName}
  numCommitted: number;
  numOnOrder: number;
  listPrice?: MoneyValue;
  bins: LocationBinSeedEntry[];
};

export type PartSeedEntry = {
  partNumber: string;
  description: string;
  sellUom?: string;
  listPrice?: MoneyValue;
  vendors: PartVendorSeedEntry[];
  locations: PartLocationSeedEntry[];
};

export const partSeedData: PartSeedEntry[] = [
  // ── Engine Oils & Fluids ──────────────────────────────────────────────────
  {
    partNumber: 'OIL-5W30-QT',
    description: '5W-30 Full Synthetic Motor Oil - 1 Quart',
    sellUom: 'QT',
    listPrice: {amount: 1299, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-OIL-5W30-1QT',
        isPrimary: true,
        cost: {amount: 645, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 4,
        numOnOrder: 24,
        bins: [{binCode: 'A-12-3', numOnHand: 48}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'A-12-3', numOnHand: 36}],
      },
    ],
  },
  {
    partNumber: 'OIL-10W30-QT',
    description: '10W-30 Conventional Motor Oil - 1 Quart',
    sellUom: 'QT',
    listPrice: {amount: 999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-OIL-10W30-1QT',
        isPrimary: true,
        cost: {amount: 595, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'A-12-3', numOnHand: 36}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 12,
        bins: [{binCode: 'A-12-3', numOnHand: 24}],
      },
    ],
  },
  {
    partNumber: 'ATF-DEXIII-QT',
    description: 'Dexron III Automatic Transmission Fluid - 1 Quart',
    sellUom: 'EA',
    listPrice: {amount: 1149, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-ATF-DEXIII-1QT',
        isPrimary: true,
        cost: {amount: 725, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-12-4', numOnHand: 24}],
      },
    ],
  },
  {
    partNumber: 'COOLANT-50-GAL',
    description: 'Antifreeze Coolant 50/50 Pre-Mixed - 1 Gallon',
    sellUom: 'GAL',
    listPrice: {amount: 1899, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-COOLANT-50-GAL',
        isPrimary: true,
        cost: {amount: 1295, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 1,
        numOnOrder: 12,
        bins: [{binCode: 'A-12-4', numOnHand: 18}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-12-4', numOnHand: 12}],
      },
    ],
  },
  {
    partNumber: 'BRAKE-FLUID-DOT3',
    description: 'DOT 3 Brake Fluid - 32 oz Bottle',
    sellUom: 'QT',
    listPrice: {amount: 849, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BRK-FLUID-DOT3',
        isPrimary: true,
        cost: {amount: 850, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 0,
        bins: [{binCode: 'A-12-4', numOnHand: 22}],
      },
    ],
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  {
    partNumber: 'FILTER-OIL-PH3593A',
    description: 'Engine Oil Filter - Fram PH3593A',
    sellUom: 'QT',
    listPrice: {amount: 699, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-OIL-PH3593A',
        isPrimary: true,
        cost: {amount: 350, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 8,
        numOnOrder: 48,
        bins: [{binCode: 'A-13-1', numOnHand: 72}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 4,
        numOnOrder: 24,
        bins: [{binCode: 'A-13-1', numOnHand: 48}],
      },
    ],
  },
  {
    partNumber: 'FILTER-AIR-CA10171',
    description: 'Engine Air Filter - Fram CA10171',
    sellUom: 'EA',
    listPrice: {amount: 1499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-AIR-CA10171',
        isPrimary: true,
        cost: {amount: 725, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 4,
        numOnOrder: 24,
        bins: [{binCode: 'A-13-1', numOnHand: 45}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'A-13-1', numOnHand: 30}],
      },
    ],
  },
  {
    partNumber: 'FILTER-FUEL-G7335',
    description: 'Fuel Filter - Baldwin G7335',
    sellUom: 'EA',
    listPrice: {amount: 1175, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-FUEL-G7335',
        isPrimary: true,
        cost: {amount: 590, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 12,
        bins: [{binCode: 'A-13-2', numOnHand: 32}],
      },
    ],
  },

  // ── Brakes ────────────────────────────────────────────────────────────────
  {
    partNumber: 'BRAKE-PAD-FRONT',
    description: 'Front Brake Pad Set - Semi-Metallic',
    sellUom: 'EA',
    listPrice: {amount: 4599, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BRK-FRT-SM',
        isPrimary: true,
        cost: {amount: 2250, currency: 'USD'},
      },
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-BRK-FRT-SM',
        isPrimary: false,
        cost: {amount: 2400, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 8,
        bins: [{binCode: 'C-08-1', numOnHand: 24}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 1,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-1', numOnHand: 12}],
      },
    ],
  },
  {
    partNumber: 'BRAKE-ROTOR-FRONT',
    description: 'Front Brake Rotor - Slotted & Drilled',
    sellUom: 'EA',
    listPrice: {amount: 8999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-ROT-FRT-SD',
        isPrimary: true,
        cost: {amount: 4450, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-2', numOnHand: 8}],
      },
    ],
  },

  // ── Electrical ────────────────────────────────────────────────────────────
  {
    partNumber: 'BATT-12V-GROUP24',
    description: 'Lead Acid Battery 12V Group 24 - 550 CCA',
    sellUom: 'EA',
    listPrice: {amount: 10999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-BAT-12V-G24',
        isPrimary: true,
        cost: {amount: 6200, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 1,
        numOnOrder: 4,
        bins: [{binCode: 'D-01-1', numOnHand: 10}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'D-01-1', numOnHand: 6}],
      },
    ],
  },
  {
    partNumber: 'ALT-12V-90A',
    description: 'Alternator 12V 90A - Remanufactured',
    sellUom: 'EA',
    listPrice: {amount: 14999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-ALT-12V-90A',
        isPrimary: true,
        cost: {amount: 8500, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'D-02-2', numOnHand: 4}],
      },
    ],
  },

  // ── Spark Plugs ───────────────────────────────────────────────────────────
  {
    partNumber: 'PLUG-NGK-BPR5ES',
    description: 'NGK Spark Plug BPR5ES',
    sellUom: 'EA',
    listPrice: {amount: 399, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-SPK-BPR5ES',
        isPrimary: true,
        cost: {amount: 180, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 8,
        numOnOrder: 48,
        bins: [{binCode: 'B-05-1', numOnHand: 120}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 4,
        numOnOrder: 24,
        bins: [{binCode: 'B-05-1', numOnHand: 80}],
      },
    ],
  },
  {
    partNumber: 'PLUG-IRIDIUM-IGR7',
    description: 'Iridium Spark Plug IGR7 - Premium 4-pack',
    sellUom: 'EA',
    listPrice: {amount: 3299, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-SPK-IGR7-4PK',
        isPrimary: true,
        cost: {amount: 1875, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'B-05-1', numOnHand: 36}],
      },
    ],
  },

  // ── Belts & Hoses ─────────────────────────────────────────────────────────
  {
    partNumber: 'BELT-SERPENTINE-K060882',
    description: 'Serpentine Drive Belt K060882',
    sellUom: 'EA',
    listPrice: {amount: 2850, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BLT-K060882',
        isPrimary: true,
        cost: {amount: 1425, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-13-2', numOnHand: 18}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 1,
        numOnOrder: 6,
        bins: [{binCode: 'A-13-2', numOnHand: 12}],
      },
    ],
  },
  {
    partNumber: 'HOSE-UPPER-RAD',
    description: 'Upper Radiator Hose - Heavy Duty Silicone',
    sellUom: 'FT',
    listPrice: {amount: 2275, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-HSE-UPPER-RAD',
        isPrimary: true,
        cost: {amount: 1150, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-13-2', numOnHand: 14}],
      },
    ],
  },

  // ── Lighting ──────────────────────────────────────────────────────────────
  {
    partNumber: 'BULB-H11-55W',
    description: 'Headlight Bulb H11 55W Halogen',
    sellUom: 'EA',
    listPrice: {amount: 1299, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BLB-H11-55W',
        isPrimary: true,
        cost: {amount: 550, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 12,
        bins: [{binCode: 'B-05-2', numOnHand: 35}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'B-05-2', numOnHand: 20}],
      },
    ],
  },
  {
    partNumber: 'BULB-LED-WORK-48W',
    description: 'LED Work Light Bar 48W Flood - Waterproof',
    sellUom: 'EA',
    listPrice: {amount: 4999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-LED-48W-FLOOD',
        isPrimary: true,
        cost: {amount: 2800, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'B-05-2', numOnHand: 8}],
      },
    ],
  },

  // ── Wiper Blades ─────────────────────────────────────────────────────────
  {
    partNumber: 'WIPER-BEAM-22IN',
    description: 'Beam Wiper Blade 22 inch - Bracketless',
    sellUom: 'EA',
    listPrice: {amount: 1699, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-WPR-BEAM-22',
        isPrimary: true,
        cost: {amount: 825, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'B-05-3', numOnHand: 42}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'B-05-3', numOnHand: 24}],
      },
    ],
  },
  {
    partNumber: 'WIPER-BEAM-18IN',
    description: 'Beam Wiper Blade 18 inch - Bracketless',
    sellUom: 'EA',
    listPrice: {amount: 1499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-WPR-BEAM-18',
        isPrimary: true,
        cost: {amount: 750, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 12,
        bins: [{binCode: 'B-05-3', numOnHand: 38}],
      },
    ],
  },

  // ── Suspension & Steering ─────────────────────────────────────────────────
  {
    partNumber: 'SHOCK-FRONT-MONO',
    description: 'Front Shock Absorber - Monotube Gas Charged',
    sellUom: 'EA',
    listPrice: {amount: 7999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-SHOCK-FRT-MONO',
        isPrimary: true,
        cost: {amount: 4200, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-2', numOnHand: 14}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'C-08-2', numOnHand: 6}],
      },
    ],
  },
  {
    partNumber: 'TIE-ROD-END-OUTER',
    description: 'Outer Tie Rod End - Heavy Duty',
    sellUom: 'EA',
    listPrice: {amount: 3499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-TRE-OUTER-HD',
        isPrimary: true,
        cost: {amount: 1800, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 1,
        numOnOrder: 6,
        bins: [{binCode: 'C-08-1', numOnHand: 16}],
      },
    ],
  },

  // ── Exhaust ───────────────────────────────────────────────────────────────
  {
    partNumber: 'OXYGEN-SENSOR-UPSTREAM',
    description: 'Upstream O2 Sensor - Universal Heated 4-Wire',
    sellUom: 'EA',
    listPrice: {amount: 4299, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-O2S-UPS-4W',
        isPrimary: true,
        cost: {amount: 2275, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 6,
        bins: [{binCode: 'D-02-2', numOnHand: 18}],
      },
    ],
  },

  // ── Thermal Management ────────────────────────────────────────────────────
  {
    partNumber: 'THERMO-STAT-195F',
    description: 'Engine Thermostat 195°F with Gasket',
    sellUom: 'EA',
    listPrice: {amount: 1849, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-THERMO-195F',
        isPrimary: true,
        cost: {amount: 925, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-13-2', numOnHand: 22}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'A-13-2', numOnHand: 14}],
      },
    ],
  },
  {
    partNumber: 'HOSE-LOWER-RAD',
    description: 'Lower Radiator Hose - Molded EPDM',
    sellUom: 'FT',
    listPrice: {amount: 1999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-HSE-LOWER-RAD',
        isPrimary: true,
        cost: {amount: 1015, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'A-13-2', numOnHand: 12}],
      },
    ],
  },

  // ── Fasteners & Hardware ──────────────────────────────────────────────────
  {
    partNumber: 'BOLT-M10-80MM',
    description: 'M10 x 80mm Hex Bolt Grade 8.8 (Pack/10)',
    sellUom: 'EA',
    listPrice: {amount: 699, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BLT-M10-80-10PK',
        isPrimary: true,
        cost: {amount: 320, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 4,
        numOnOrder: 50,
        bins: [{binCode: 'B-05-3', numOnHand: 200}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 25,
        bins: [{binCode: 'B-05-3', numOnHand: 100}],
      },
    ],
  },
  {
    partNumber: 'NUT-HEX-M10',
    description: 'M10 Hex Nut Grade 8 (Pack/20)',
    sellUom: 'EA',
    listPrice: {amount: 499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-NUT-M10-20PK',
        isPrimary: true,
        cost: {amount: 215, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 50,
        bins: [{binCode: 'B-05-3', numOnHand: 300}],
      },
    ],
  },

  // ── Tires & Wheels ────────────────────────────────────────────────────────
  {
    partNumber: 'TIRE-ST225-75R15',
    description: 'Trailer Tire ST225/75R15 Load Range D',
    sellUom: 'EA',
    listPrice: {amount: 12499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-TIRE-ST225-75R15',
        isPrimary: true,
        cost: {amount: 7200, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 4,
        numOnOrder: 8,
        bins: [{binCode: 'C-08-2', numOnHand: 16}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 2,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-2', numOnHand: 8}],
      },
    ],
  },
  {
    partNumber: 'VALVE-STEM-TR413',
    description: 'Snap-In Tire Valve Stem TR413 (Pack/4)',
    sellUom: 'EA',
    listPrice: {amount: 349, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-VS-TR413-4PK',
        isPrimary: true,
        cost: {amount: 150, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 20,
        bins: [{binCode: 'B-05-2', numOnHand: 80}],
      },
    ],
  },

  // ── RV / Marine Specific ──────────────────────────────────────────────────
  {
    partNumber: 'IMPELLER-GLM-24-3',
    description: 'Water Pump Impeller Kit 24-3',
    sellUom: 'EA',
    listPrice: {amount: 13400, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-IMP-24-3',
        isPrimary: true,
        cost: {amount: 7800, currency: 'USD'},
      },
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-IMP-24-3',
        isPrimary: false,
        cost: {amount: 8200, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 1,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-1', numOnHand: 3}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'C-08-1', numOnHand: 2}],
      },
    ],
  },
  {
    partNumber: 'ANNODE-ZINC-STERNDRIVE',
    description: 'Zinc Anode Kit - Sterndrive 4-piece',
    sellUom: 'EA',
    listPrice: {amount: 4850, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-ZN-SD-4PC',
        isPrimary: true,
        cost: {amount: 2650, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-1', numOnHand: 8}],
      },
    ],
  },
  {
    partNumber: 'PROP-ALUMINUM-14X19',
    description: 'Aluminum Propeller 14 x 19 3-Blade',
    sellUom: 'EA',
    listPrice: {amount: 18999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-PROP-AL-14X19',
        isPrimary: true,
        cost: {amount: 11000, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'D-02-2', numOnHand: 4}],
      },
    ],
  },
  {
    partNumber: 'FUEL-PUMP-12V-EFI',
    description: 'In-Tank Electric Fuel Pump 12V EFI',
    sellUom: 'EA',
    listPrice: {amount: 8999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-FP-12V-EFI',
        isPrimary: true,
        cost: {amount: 4800, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 4,
        bins: [{binCode: 'D-02-2', numOnHand: 10}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'D-02-2', numOnHand: 4}],
      },
    ],
  },
  {
    partNumber: 'GEAR-OIL-80W90-QT',
    description: 'Gear Lube 80W-90 API GL-5 - 1 Quart',
    sellUom: 'QT',
    listPrice: {amount: 949, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-GO-80W90-1QT',
        isPrimary: true,
        cost: {amount: 480, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 12,
        bins: [{binCode: 'A-12-3', numOnHand: 28}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 6,
        bins: [{binCode: 'A-12-3', numOnHand: 16}],
      },
    ],
  },

  // ── Trailer / RV Systems ──────────────────────────────────────────────────
  {
    partNumber: 'COUPLER-BALL-2IN',
    description: 'Ball Mount Coupler 2-inch A-Frame',
    sellUom: 'EA',
    listPrice: {amount: 3999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-COU-BALL-2IN',
        isPrimary: true,
        cost: {amount: 2150, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 0,
        numOnOrder: 4,
        bins: [{binCode: 'C-08-1', numOnHand: 12}],
      },
    ],
  },
  {
    partNumber: 'BREAKAWAY-KIT-7WAY',
    description: 'Trailer Breakaway Kit with 7-Way Plug',
    sellUom: 'EA',
    listPrice: {amount: 5499, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'CLINCHTECH',
        vendorPartNumber: 'CLN-BAK-7WAY',
        isPrimary: true,
        cost: {amount: 2900, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 1,
        numOnOrder: 4,
        bins: [{binCode: 'D-01-1', numOnHand: 10}],
      },
      {
        locationName: 'LOC_AAA',
        numCommitted: 0,
        numOnOrder: 2,
        bins: [{binCode: 'D-01-1', numOnHand: 6}],
      },
    ],
  },
  {
    partNumber: 'BEARING-BUDDY-2000',
    description: 'Bearing Buddy Protector 2.000″ OD (Pair)',
    sellUom: 'EA',
    listPrice: {amount: 1999, currency: 'USD'},
    vendors: [
      {
        vendorCode: 'STAR-OFFICE',
        vendorPartNumber: 'STR-BB-2000-PR',
        isPrimary: true,
        cost: {amount: 1050, currency: 'USD'},
      },
    ],
    locations: [
      {
        locationName: 'LOC_HQ',
        numCommitted: 2,
        numOnOrder: 12,
        bins: [{binCode: 'C-08-2', numOnHand: 30}],
      },
    ],
  },
];
