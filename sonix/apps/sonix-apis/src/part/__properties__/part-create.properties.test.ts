/**
 * LOCKED PROPERTY TESTS — Add a new part (DMSMOD-15 / DMSMOD-59).
 *
 * Derived from sonix/docs/features/parts/part-create.md before any create code existed, approved
 * by the repo owner, and locked: the implementing agent cannot edit this file (Claude Code hook)
 * and a pull request cannot change it (CI compares it with the lock on the base branch).
 * See docs/properties/part-create.md (the approved list) and docs/property-testing.md (the lock).
 *
 * Every property runs NUM_RUNS generated cases. On failure fast-check prints the seed, the path
 * and the shrunk counterexample.
 */
import {BadRequestException, ConflictException, NotFoundException} from '@nestjs/common';
import {plainToInstance} from 'class-transformer';
import {validate} from 'class-validator';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';
import type {RavenDocumentStoreProvider} from '../../infrastructure/ravendb/document-store.provider';
import type {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import {PartCreateDto} from '../dto/part-create.dto';
import {PartService} from '../part.service';

const NUM_RUNS = 1000;
const run = {numRuns: NUM_RUNS};

// ── In-memory world: vendors, a location and its bins (spec 201-211, 788-823) ─────────────────

const VENDORS = ['V1', 'V2', 'V3', 'V4'];
const MISSING_VENDOR = 'VX';
const LOCATION = 'LOC_A';
const MISSING_LOCATION = 'LOC_MISSING';
const BINS = ['B1', 'B2', 'B3'];
const MISSING_BIN = 'B9';
const STATUSES = ['active', 'inactive', 'discontinued', 'retired'];

type Doc = Record<string, unknown>;

function seedWorld(): Map<string, Doc> {
  const docs = new Map<string, Doc>();
  for (const v of VENDORS) {
    docs.set(`vendors/${v}`, {
      id: `vendors/${v}`,
      vendorNumber: v,
      name: `Vendor ${v}`,
      isDeleted: false,
    });
  }
  docs.set(`locations/${LOCATION}`, {
    id: `locations/${LOCATION}`,
    name: LOCATION,
    displayName: 'Location A',
  });
  for (const b of BINS) {
    docs.set(`bins/${LOCATION}/${b}`, {
      id: `bins/${LOCATION}/${b}`,
      binNumber: b,
      description: `Bin ${b}`,
      locationId: `locations/${LOCATION}`,
    });
  }
  return docs;
}

const clone = <T>(x: T): T => (x === undefined ? x : structuredClone(x));

/** Fake RavenDB session: load(id), load(ids[]) -> {id: doc|null}, store(entity, id?), saveChanges(). */
function fakeSession(docs: Map<string, Doc>) {
  const pending = new Map<string, Doc>();
  return {
    async load(idOrIds: string | string[]) {
      if (Array.isArray(idOrIds)) {
        return Object.fromEntries(idOrIds.map((id) => [id, clone(docs.get(id)) ?? null]));
      }
      return clone(docs.get(idOrIds)) ?? null;
    },
    async store(entity: Doc, id?: string) {
      const key = id ?? (entity['id'] as string);
      pending.set(key, entity);
    },
    async saveChanges() {
      for (const [id, e] of pending) {
        docs.set(id, clone(e));
      }
      pending.clear();
    },
    dispose() {},
    [Symbol.dispose]() {},
  };
}

function makeService(docs: Map<string, Doc>): PartService {
  const sessionFactory = {openSession: () => fakeSession(docs)} as unknown as RavenSessionFactory;
  const storeProvider = {getStore: () => ({})} as unknown as RavenDocumentStoreProvider;
  return new PartService(storeProvider, sessionFactory);
}

const USER = 'user-prop-test';

// ── Generators ────────────────────────────────────────────────────────────────────────────────

const partNumberArb = fc.stringMatching(/^[A-Za-z0-9._-]{1,50}$/);
const descriptionArb = fc.string({minLength: 1, maxLength: 40});
const qty = fc.integer({min: 0, max: 100_000});
const cents = fc.integer({min: 0, max: 10_000_000});
const opt = <T>(a: fc.Arbitrary<T>) => fc.option(a, {nil: undefined});

/** Drop keys whose value is undefined, so "absent" really is absent from the JSON payload. */
function compact<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/** Vendors that satisfy every vendor rule: existing, unique, exactly one primary. */
const validVendorsArb = fc
  .uniqueArray(fc.constantFrom(...VENDORS), {minLength: 1, maxLength: VENDORS.length})
  .chain((numbers) =>
    fc.tuple(
      fc.constant(numbers),
      fc.nat({max: numbers.length - 1}),
      fc.array(fc.tuple(opt(cents), opt(fc.stringMatching(/^[A-Z0-9-]{1,12}$/))), {
        minLength: numbers.length,
        maxLength: numbers.length,
      }),
    ),
  )
  .map(([numbers, primary, extras]) =>
    numbers.map((vendorNumber, i) =>
      compact({
        vendorNumber,
        isPrimary: i === primary,
        cost: extras[i][0],
        vendorPartNumber: extras[i][1],
      }),
    ),
  );

/** Location + bins that satisfy every bin rule: existing location, existing unique bins, one main. */
const validInventoryArb = fc.oneof(
  fc.constant({}),
  fc.record({locationId: fc.constant(LOCATION), onHandQty: opt(qty)}).map(compact),
  fc
    .tuple(
      fc.uniqueArray(fc.constantFrom(...BINS), {minLength: 1, maxLength: BINS.length}),
      fc.nat(),
      opt(qty),
    )
    .map(([codes, main, onHandQty]) =>
      compact({
        locationId: LOCATION,
        onHandQty,
        bins: codes.map((binCode, i) => ({binCode, isMain: i === main % codes.length})),
      }),
    ),
);

/** Restocking + shipping fields that satisfy the cross-field rules (spec 523-530). */
const validRestockArb = fc
  .record({
    a: opt(qty),
    b: opt(qty),
    caseQty: opt(qty),
    minDays: opt(qty),
    minOrder: opt(qty),
    shippingWeight: opt(fc.integer({min: 0, max: 5000})),
    shippingUnit: opt(fc.constantFrom('BOX', 'PALLET', 'EA')),
  })
  .map(({a, b, shippingWeight, shippingUnit, ...rest}) => {
    const [minQty, maxQty] =
      a !== undefined && b !== undefined ? [Math.min(a, b), Math.max(a, b)] : [a, b];
    const unit =
      shippingWeight !== undefined && shippingWeight > 0 ? (shippingUnit ?? 'BOX') : shippingUnit;
    return compact({...rest, minQty, maxQty, shippingWeight, shippingUnit: unit});
  });

const validCreateArb = fc
  .record({
    partNumber: partNumberArb,
    description: descriptionArb,
    status: opt(fc.constantFrom(...STATUSES)),
    vendors: validVendorsArb,
    listPrice: opt(cents),
    sellUom: opt(fc.constantFrom('EA', 'SET', 'QT')),
    purchaseUom: opt(fc.constantFrom('EA', 'SET', 'QT')),
    salePurchaseRatio: opt(fc.integer({min: 1, max: 100})),
    priceGroup: opt(fc.constantFrom('PG1', 'PG2')),
    glGroup: opt(fc.constantFrom('GL1', 'GL2')),
    taxCode: opt(fc.constantFrom('TX', 'EX')),
    pogNumber: opt(fc.stringMatching(/^[A-Za-z0-9]{1,8}$/)),
    popCode: opt(fc.constantFrom('A', 'B', 'C')),
    comments: opt(fc.string({maxLength: 30})),
    bypassPriceUpdate: opt(fc.boolean()),
    serialized: opt(fc.boolean()),
    restock: validRestockArb,
    inventory: validInventoryArb,
  })
  .map(({restock, inventory, ...rest}) => compact({...rest, ...restock, ...inventory}));

type Payload = Record<string, unknown> & {
  partNumber: string;
  vendors: {vendorNumber: string; isPrimary: boolean; cost?: number; vendorPartNumber?: string}[];
  bins?: {binCode: string; isMain: boolean}[];
};

/**
 * Payloads that pass DTO validation but may break any service rule (spec 523-566, 629-643, 733-743).
 */
const anyRulesCreateArb = fc
  .record({
    partNumber: partNumberArb,
    description: descriptionArb,
    vendors: fc.array(
      fc
        .record({
          vendorNumber: fc.constantFrom(...VENDORS, MISSING_VENDOR),
          isPrimary: fc.boolean(),
          cost: opt(cents),
        })
        .map(compact),
      {minLength: 1, maxLength: 4},
    ),
    minQty: opt(qty),
    maxQty: opt(qty),
    shippingWeight: opt(fc.integer({min: 0, max: 50})),
    shippingUnit: opt(fc.constant('BOX')),
    locationId: opt(fc.constantFrom(LOCATION, MISSING_LOCATION)),
    bins: opt(
      fc.array(fc.record({binCode: fc.constantFrom(...BINS, MISSING_BIN), isMain: fc.boolean()}), {
        maxLength: 4,
      }),
    ),
    onHandQty: opt(qty),
  })
  .map((p) => (p.locationId === undefined ? compact({...p, bins: undefined}) : compact(p)));

/** Reference model of the service rules: the set of statuses the spec allows for this payload. */
function expectedStatuses(p: Payload): Set<number> {
  const s = new Set<number>();
  const primaries = p.vendors.filter((v) => v.isPrimary).length;
  const numbers = p.vendors.map((v) => v.vendorNumber);
  if (primaries !== 1) {
    s.add(400);
  }
  if (new Set(numbers).size !== numbers.length) {
    s.add(400);
  }
  if (numbers.some((n) => !VENDORS.includes(n))) {
    s.add(400);
  }
  const minQty = p['minQty'] as number | undefined;
  const maxQty = p['maxQty'] as number | undefined;
  if (minQty !== undefined && maxQty !== undefined && maxQty < minQty) {
    s.add(400);
  }
  const weight = p['shippingWeight'] as number | undefined;
  if (weight !== undefined && weight > 0 && !p['shippingUnit']) {
    s.add(400);
  }
  if (p['locationId'] === MISSING_LOCATION) {
    s.add(404);
  }
  const bins = p.bins ?? [];
  if (bins.length > 0) {
    const codes = bins.map((b) => b.binCode);
    if (bins.filter((b) => b.isMain).length !== 1) {
      s.add(400);
    }
    if (new Set(codes).size !== codes.length) {
      s.add(400);
    }
    // A bin can only resolve inside an existing location; under a missing one, 404 or 400 are both fine.
    if (p['locationId'] === MISSING_LOCATION || codes.some((c) => !BINS.includes(c))) {
      s.add(400);
    }
  }
  return s;
}

function statusOf(e: unknown): number {
  if (e instanceof BadRequestException) {
    return 400;
  }
  if (e instanceof NotFoundException) {
    return 404;
  }
  if (e instanceof ConflictException) {
    return 409;
  }
  throw e;
}

async function attempt(service: PartService, p: Payload): Promise<number> {
  try {
    await service.create(plainToInstance(PartCreateDto, clone(p)), USER);
    return 201;
  } catch (e) {
    return statusOf(e);
  }
}

const storedPart = (docs: Map<string, Doc>, partNumber: string) =>
  docs.get(`parts/${partNumber}`) as Doc | undefined;

type StoredVendor = {
  vendor: {vendorNumber: string};
  isPrimary: boolean;
  cost?: {amount: number; currency: string};
  vendorPartNumber?: string;
};
type StoredLocation = {
  numOnHand: number;
  numCommitted: number;
  numSpecialOrderCommitted: number;
  numOnOrder: number;
  numBackordered: number;
  numAvailable: number;
  bins: {bin: {binNumber: string}; numOnHand: number; isMain: boolean}[];
};

// ── P1 Round-trip (spec 64, 70, 517, 641, 1084-1086) ──────────────────────────────────────────

describe('P1 round-trip: create then findOne gives back what was sent', () => {
  it('holds for every valid payload', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateArb, async (p) => {
        const docs = seedWorld();
        const service = makeService(docs);
        const created = await service.create(plainToInstance(PartCreateDto, clone(p)), USER);
        expect(created.partNumber).toBe(p.partNumber);
        expect(created.description).toBe(p['description']);
        expect(created.locationId ?? null).toBe((p['locationId'] as string | undefined) ?? null);

        const d = await service.findOne(p.partNumber as string);
        expect(d.partNumber).toBe(p.partNumber);
        expect(d.description).toBe(p['description']);
        expect(d.status).toBe(p['status'] ?? 'active');
        expect(d.listPrice?.amount ?? 0).toBe(p['listPrice'] ?? 0);
        for (const k of [
          'sellUom',
          'purchaseUom',
          'salePurchaseRatio',
          'priceGroup',
          'glGroup',
          'taxCode',
          'popCode',
          'caseQty',
          'minQty',
          'maxQty',
          'minDays',
          'minOrder',
          'shippingWeight',
          'shippingUnit',
        ] as const) {
          expect((d as unknown as Record<string, unknown>)[k] ?? null).toEqual(p[k] ?? null);
        }
        expect(d.bypassPriceUpdate).toBe(p['bypassPriceUpdate'] ?? false);
        expect(d.promptForSerialNumber).toBe(p['serialized'] ?? false);

        const byNumber = new Map(d.vendors.map((v) => [v.vendorNumber, v]));
        expect(byNumber.size).toBe(p.vendors.length);
        for (const v of p.vendors) {
          const got = byNumber.get(v.vendorNumber);
          expect(got).toBeDefined();
          expect(got?.isPrimary).toBe(v.isPrimary);
          expect(got?.cost?.amount ?? 0).toBe(v.cost ?? 0); // cents in, the same cents out
          expect(got?.vendorPartNumber).toBe(v.vendorPartNumber ?? p.partNumber);
        }
      }),
      run,
    );
  });
});

// ── P2 Invariant: vendors + avgCost (spec 41-43, 547, 553, 575, 1164-1166) ─────────────────────

describe('P2 invariant: every accepted part has one primary vendor and avgCost from it', () => {
  it('holds for every payload create accepts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(validCreateArb, anyRulesCreateArb) as fc.Arbitrary<Payload>,
        async (p) => {
          const docs = seedWorld();
          if ((await attempt(makeService(docs), p)) !== 201) {
            return;
          }
          const part = storedPart(docs, p.partNumber);
          expect(part).toBeDefined();
          const vendors = part?.['vendors'] as StoredVendor[];
          const primaries = vendors.filter((v) => v.isPrimary);
          expect(primaries).toHaveLength(1);
          const numbers = vendors.map((v) => v.vendor.vendorNumber);
          expect(new Set(numbers).size).toBe(numbers.length);
          const avgCost = part?.['avgCost'] as {amount: number; currency: string};
          expect(avgCost).toEqual(primaries[0].cost ?? {amount: 0, currency: 'USD'});
          expect(avgCost.currency).toBe('USD');
          for (const loc of (part?.['locations'] as StoredLocation[]) ?? []) {
            if (loc.bins.length > 0) {
              expect(loc.bins.filter((b) => b.isMain)).toHaveLength(1);
            }
          }
        },
      ),
      run,
    );
  });
});

// ── P3 Invariant: inventory rollups (spec 425-464, 673-703, 748) ──────────────────────────────

describe('P3 invariant: rollup totals add up on create', () => {
  it('holds for every valid payload', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateArb, async (p) => {
        const docs = seedWorld();
        await makeService(docs).create(plainToInstance(PartCreateDto, clone(p)), USER);
        const part = storedPart(docs, p.partNumber as string) as Doc;
        const locs = part['locations'] as StoredLocation[];
        expect(locs).toHaveLength(p['locationId'] ? 1 : 0);
        for (const l of locs) {
          expect(l.numOnHand).toBe((p['onHandQty'] as number | undefined) ?? 0);
          expect([
            l.numCommitted,
            l.numSpecialOrderCommitted,
            l.numOnOrder,
            l.numBackordered,
          ]).toEqual([0, 0, 0, 0]);
          expect(l.numAvailable).toBe(l.numOnHand + l.numOnOrder - l.numCommitted);
          if (l.bins.length > 0) {
            expect(l.bins.reduce((s, b) => s + b.numOnHand, 0)).toBe(l.numOnHand);
          }
        }
        const sum = (k: keyof StoredLocation) => locs.reduce((s, l) => s + (l[k] as number), 0);
        expect(part['totalOnHand']).toBe(sum('numOnHand'));
        expect(part['totalCommitted']).toBe(sum('numCommitted'));
        expect(part['totalOnOrder']).toBe(sum('numOnOrder'));
        expect(part['totalSpecialOrderCommitted']).toBe(sum('numSpecialOrderCommitted'));
        expect(part['totalBackordered']).toBe(sum('numBackordered'));
        expect(part['totalAvailable']).toBe(
          (part['totalOnHand'] as number) +
            (part['totalOnOrder'] as number) -
            (part['totalCommitted'] as number),
        );
        expect(part['totalNetAvailable']).toBe(
          (part['totalAvailable'] as number) - (part['totalSpecialOrderCommitted'] as number),
        );
      }),
      run,
    );
  });
});

// ── P4 Equivalence: service rules vs a reference model (spec 523-566, 629-643, 733-743, 870-879) ─

describe('P4 equivalence: create rejects exactly when the reference model says so', () => {
  it('holds for payloads that may break any business rule', async () => {
    await fc.assert(
      fc.asyncProperty(anyRulesCreateArb as fc.Arbitrary<Payload>, async (p) => {
        const docs = seedWorld();
        const status = await attempt(makeService(docs), p);
        const allowed = expectedStatuses(p);
        if (allowed.size === 0) {
          expect(status).toBe(201);
          expect(storedPart(docs, p.partNumber)).toBeDefined();
        } else {
          expect(allowed.has(status)).toBe(true);
          expect(storedPart(docs, p.partNumber)).toBeUndefined(); // a rejected create writes nothing
        }
      }),
      run,
    );
  });
});

// ── P5 Equivalence: DTO validation vs the spec's field rules (spec 50, 245, 499, 874, 914-1003) ──

async function dtoErrors(payload: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(PartCreateDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const flat: string[] = [];
  const walk = (es: typeof errors, prefix: string) => {
    for (const e of es) {
      flat.push(prefix + e.property);
      if (e.children?.length) {
        walk(e.children, `${prefix}${e.property}.`);
      }
    }
  };
  walk(errors, '');
  return flat;
}

const baseValid = () => ({
  partNumber: 'P-1',
  description: 'Part',
  vendors: [{vendorNumber: 'V1', isPrimary: true}],
});

describe('P5 equivalence: DTO validation matches the spec field rules', () => {
  it('partNumber is accepted iff it is 1-50 of [A-Za-z0-9._-]', async () => {
    const candidate = fc.oneof(
      partNumberArb,
      fc.string({maxLength: 60}),
      fc.stringMatching(/^[A-Za-z0-9._-]{45,60}$/),
      fc.stringMatching(/^[A-Za-z0-9 /#@!*+]{1,10}$/),
    );
    await fc.assert(
      fc.asyncProperty(candidate, async (partNumber) => {
        const ok = /^[A-Za-z0-9._-]{1,50}$/.test(partNumber);
        const errs = await dtoErrors({...baseValid(), partNumber});
        expect(errs.includes('partNumber')).toBe(!ok);
      }),
      run,
    );
  });

  it('description is accepted iff it is a non-empty string', async () => {
    const candidate = fc.oneof(
      fc.constant(''),
      fc.string({maxLength: 20}),
      fc.integer(),
      fc.constant(null),
    );
    await fc.assert(
      fc.asyncProperty(candidate, async (description) => {
        const ok = typeof description === 'string' && description.length > 0;
        const errs = await dtoErrors({...baseValid(), description});
        expect(errs.includes('description')).toBe(!ok);
      }),
      run,
    );
  });

  it('vendors is accepted iff it has at least one entry', async () => {
    await fc.assert(
      fc.asyncProperty(fc.nat({max: 3}), async (n) => {
        const vendors = VENDORS.slice(0, n).map((vendorNumber, i) => ({
          vendorNumber,
          isPrimary: i === 0,
        }));
        const errs = await dtoErrors({...baseValid(), vendors});
        expect(errs.includes('vendors')).toBe(n === 0);
      }),
      run,
    );
  });

  it('every numeric field is accepted iff it is a number >= 0', async () => {
    const fields = [
      'listPrice',
      'salePurchaseRatio',
      'shippingWeight',
      'caseQty',
      'minQty',
      'maxQty',
      'minDays',
      'minOrder',
      'onHandQty',
      'vendors.0.cost',
    ];
    const value = fc.oneof(
      fc.integer({min: -1000, max: 1000}),
      fc.double({noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6}),
    );
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...fields), value, async (field, v) => {
        const payload: Record<string, unknown> = {
          ...baseValid(),
          vendors: [{vendorNumber: 'V1', isPrimary: true}],
        };
        if (field === 'vendors.0.cost') {
          (payload['vendors'] as Doc[])[0]['cost'] = v;
        } else {
          payload[field] = v;
        }
        const errs = await dtoErrors(payload);
        expect(errs.includes(field)).toBe(!(v >= 0));
      }),
      run,
    );
  });

  it('pogNumber is accepted iff it is at most 8 characters', async () => {
    await fc.assert(
      fc.asyncProperty(fc.stringMatching(/^[A-Za-z0-9]{1,12}$/), async (pogNumber) => {
        const errs = await dtoErrors({...baseValid(), pogNumber});
        expect(errs.includes('pogNumber')).toBe(pogNumber.length > 8);
      }),
      run,
    );
  });
});

// ── P6 Idempotency: duplicate create (spec 45, 51, 135-150, 505, 879, 1152-1154) ──────────────

describe('P6 idempotency: creating the same part again is 409 and changes nothing', () => {
  it('holds for every valid payload, repeated 2-4 times', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateArb, fc.integer({min: 2, max: 4}), async (p, times) => {
        const docs = seedWorld();
        const service = makeService(docs);
        expect(await attempt(service, p as Payload)).toBe(201);
        const first = clone(storedPart(docs, p.partNumber as string));
        for (let i = 1; i < times; i++) {
          expect(await attempt(service, p as Payload)).toBe(409);
        }
        expect(storedPart(docs, p.partNumber as string)).toEqual(first);
      }),
      run,
    );
  });
});

// ── P7 Idempotency: pogNumber stored uppercase (spec 323, 535) ────────────────────────────────

describe('P7 idempotency: pogNumber is stored uppercase and uppercasing again changes nothing', () => {
  it('holds for every pogNumber of up to 8 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCreateArb,
        fc.stringMatching(/^[A-Za-z0-9]{1,8}$/),
        async (p, pogNumber) => {
          const docs = seedWorld();
          const service = makeService(docs);
          await service.create(plainToInstance(PartCreateDto, {...clone(p), pogNumber}), USER);
          const stored = storedPart(docs, p.partNumber as string)?.['pogNumber'] as string;
          expect(stored).toBe(pogNumber.toUpperCase());
          expect(stored.toUpperCase()).toBe(stored);
          expect((await service.findOne(p.partNumber as string)).pogNumber).toBe(stored);
        },
      ),
      run,
    );
  });
});
