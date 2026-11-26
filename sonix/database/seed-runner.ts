import {config} from 'dotenv';
import {DocumentStore} from 'ravendb';
import {binSeedData} from './seeds/data/bin.data.js';
import {glGroupSeedData} from './seeds/data/gl-group.data.js';
import {groupCodeSeedData} from './seeds/data/group-code.data.js';
import {locationSeedData} from './seeds/data/location.data.js';
import {partSeedData} from './seeds/data/part.data.js';
import {partStatusCodeSeedData} from './seeds/data/part-status-code.data.js';
import {saleCategorySeedData} from './seeds/data/sale-category.data.js';
import {shipWeightCodeSeedData} from './seeds/data/ship-weight-code.data.js';
import {taxCodeSeedData} from './seeds/data/tax-code.data.js';
import {unitOfMeasurementSeedData} from './seeds/data/uom.data.js';
import {userSeedData} from './seeds/data/user.data.js';
import {vendorSeedData} from './seeds/data/vendor.data.js';

config();

type PartLocationSeedData = {
  id: string;
  partSeedId: string;
  binSeedId: string;
  locationName: string;
  onHandQty: number;
};

type PartVendorSeedData = {
  id: string;
  partId: string;
  vendorId: string;
  vendorPartNumber?: string;
  cost?: {amount: number; currency: string};
  setPrimaryVendor: boolean;
};

const partLocationSeedData: PartLocationSeedData[] = partSeedData.flatMap((part, partIndex) =>
  part.locations.flatMap((location, locationIndex) =>
    location.bins.map((bin, binIndex) => ({
      id: `pl-${partIndex + 1}-${locationIndex + 1}-${binIndex + 1}`,
      partSeedId: part.partNumber,
      binSeedId: `${location.locationName}/${bin.binCode}`,
      locationName: location.locationName,
      onHandQty: bin.numOnHand,
    })),
  ),
);

const partVendorSeedData: PartVendorSeedData[] = partSeedData.flatMap((part, partIndex) =>
  part.vendors.map((vendor, vendorIndex) => ({
    id: `pv-${partIndex + 1}-${vendorIndex + 1}`,
    partId: `parts/${part.partNumber}`,
    vendorId: `vendors/${vendor.vendorCode}`,
    vendorPartNumber: vendor.vendorPartNumber,
    cost: vendor.cost,
    setPrimaryVendor: vendor.isPrimary,
  })),
);

const store = new DocumentStore(
  process.env.RAVENDB_URL ?? 'http://localhost:8080',
  process.env.RAVENDB_DATABASE ?? 'dms_sonix',
);
store.conventions.findCollectionNameForObjectLiteral = (entity: object): string => {
  const withId = entity as {id?: unknown};
  if (typeof withId.id !== 'string') {
    return 'objects';
  }
  const prefix = withId.id.split('/')[0];
  return prefix ?? 'objects';
};
store.initialize();

/**
 * Seeding order matters — later entities reference earlier ones:
 *
 *   1.  UOMs              (standalone lookup — no dependencies)
 *   2.  GL Groups         (standalone lookup)
 *   3.  Tax Codes         (standalone lookup)
 *   4.  Sale Categories   (standalone lookup — references GL Groups by code string only)
 *   5.  Group Codes       (standalone lookup — references GL Groups by code string only)
 *   6.  Ship Weight Codes    (standalone lookup)
 *   7.  Part Status Codes   (standalone lookup)
 *   8.  Locations            (standalone — no dependencies)
 *   9.  Vendors              (standalone — no dependencies)
 *   10. Bins                 (depends on Locations)
 *   11. Users                (standalone)
 *   12. Part-Locations       (depends on Parts seed data, Bins, Locations)
 *   13. Part-Vendors         (depends on Parts seed data, Vendors)
 *   14. Parts                (depends on Vendors, Locations, Bins, UOMs — validates all references)
 */
async function seed(): Promise<void> {
  const session = store.openSession();
  try {
    const now = new Date();

    // Build a set of valid UOM codes for part validation in step 8
    const validUomCodes = new Set(unitOfMeasurementSeedData.map((u) => u.code));

    // ── 1. UOMs ──────────────────────────────────────────────────────────────
    for (const uom of unitOfMeasurementSeedData) {
      const docId = `uoms/${uom.code}`;
      await session.store(
        {
          id: docId,
          code: uom.code,
          description: uom.description,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 2. GL Groups ─────────────────────────────────────────────────────────
    for (const glGroup of glGroupSeedData) {
      const docId = `gl-groups/${glGroup.code}`;
      await session.store(
        {
          id: docId,
          code: glGroup.code,
          description: glGroup.description,
          inventoryAccount: glGroup.inventoryAccount,
          salesAccount: glGroup.salesAccount,
          cosAccount: glGroup.cosAccount,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 3. Tax Codes ─────────────────────────────────────────────────────────
    for (const taxCode of taxCodeSeedData) {
      const docId = `tax-codes/${taxCode.code}`;
      await session.store(
        {
          id: docId,
          code: taxCode.code,
          description: taxCode.description,
          rate: taxCode.rate,
          isInactive: taxCode.isInactive,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 4. Sale Categories ───────────────────────────────────────────────────
    for (const saleCategory of saleCategorySeedData) {
      const docId = `sale-categories/${saleCategory.code}`;
      await session.store(
        {
          id: docId,
          code: saleCategory.code,
          description: saleCategory.description,
          defaultGlGroupCode: saleCategory.defaultGlGroupCode,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 5. Group Codes ───────────────────────────────────────────────────────
    for (const groupCode of groupCodeSeedData) {
      const docId = `group-codes/${groupCode.code}`;
      await session.store(
        {
          id: docId,
          code: groupCode.code,
          description: groupCode.description,
          defaultGlGroupCode: groupCode.defaultGlGroupCode,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 6. Ship Weight Codes ─────────────────────────────────────────────────
    for (const shipWeightCode of shipWeightCodeSeedData) {
      const docId = `ship-weight-codes/${shipWeightCode.code}`;
      await session.store(
        {
          id: docId,
          code: shipWeightCode.code,
          description: shipWeightCode.description,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 7. Part Status Codes ────────────────────────────────────────────────
    for (const statusCode of partStatusCodeSeedData) {
      const docId = `part-status-codes/${statusCode.code}`;
      await session.store(
        {
          id: docId,
          code: statusCode.code,
          description: statusCode.description,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 8. Locations ─────────────────────────────────────────────────────────
    const locationDocIds = locationSeedData.filter((l) => l.name).map((l) => `locations/${l.name}`);
    const existingLocations = await session.load<{createdDate: Date; version: number}>(
      locationDocIds,
    );

    for (const location of locationSeedData) {
      const name = location.name;
      if (!name) {
        continue;
      }
      const docId = `locations/${name}`;
      const existing = existingLocations[docId];
      if (existing) {
        Object.assign(existing, {
          displayName: location.displayName,
          description: location.description,
          active: location.active ?? true,
          // Preserve logtoId set by logto:sync — only overwrite if seed data has an explicit value
          ...(location.logtoId !== undefined && {logtoId: location.logtoId}),
          addresses: location.addresses,
          contacts: location.contacts,
          updatedDate: now,
          isDeleted: location.isDeleted ?? false,
        });
      } else {
        await session.store(
          {
            id: docId,
            name,
            displayName: location.displayName,
            description: location.description,
            active: location.active ?? true,
            logtoId: location.logtoId ?? null,
            addresses: location.addresses,
            contacts: location.contacts,
            createdDate: now,
            updatedDate: now,
            version: 1,
            isDeleted: location.isDeleted ?? false,
          },
          docId,
        );
      }
    }

    // ── 9. Vendors ───────────────────────────────────────────────────────────
    for (const vendor of vendorSeedData) {
      if (!vendor.code || !vendor.id) {
        continue;
      }
      await session.store(
        {
          id: `vendors/${vendor.code}`,
          vendorNumber: vendor.code,
          name: vendor.name ?? vendor.code,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        `vendors/${vendor.code}`,
      );
    }

    // ── 10. Bins ────────────────────────────────────────────────────────────
    for (const bin of binSeedData) {
      const id = `bins/${bin.locationId}/${bin.code}`;
      await session.store(
        {
          id,
          binNumber: bin.code,
          description: bin.description,
          locationId: `locations/${bin.locationId}`,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        id,
      );
    }

    // ── 11. Users ────────────────────────────────────────────────────────────
    for (const user of userSeedData) {
      await session.store(
        {
          id: user.id,
          logtoUserId: user.logtoUserId,
          displayName: user.displayName,
          email: user.email,
          username: user.username,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        user.id,
      );
    }

    // ── 12. Part-Locations ──────────────────────────────────────────────────
    for (const pl of partLocationSeedData) {
      const docId = `part-locations/${pl.id}`;
      await session.store(
        {
          id: docId,
          partSeedId: pl.partSeedId,
          binSeedId: pl.binSeedId,
          locationName: pl.locationName,
          locationId: `locations/${pl.locationName}`,
          onHandQty: pl.onHandQty,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    // ── 13. Part-Vendors ────────────────────────────────────────────────────
    for (const pv of partVendorSeedData) {
      const docId = `part-vendors/${pv.id}`;
      await session.store(
        {
          id: docId,
          partId: pv.partId,
          vendorId: pv.vendorId,
          vendorPartNumber: pv.vendorPartNumber,
          cost: pv.cost,
          setPrimaryVendor: pv.setPrimaryVendor,
          createdDate: now,
          updatedDate: now,
          version: 1,
          isDeleted: false,
        },
        docId,
      );
    }

    await session.saveChanges();

    // ── 14. Parts — one session per part to avoid stale-document collisions ─
    for (const partEntry of partSeedData) {
      const partSession = store.openSession();
      try {
        const docId = `parts/${partEntry.partNumber}`;

        // Validate sellUom against seeded UOM collection
        if (partEntry.sellUom && !validUomCodes.has(partEntry.sellUom)) {
          throw new Error(
            `Seed error: sellUom "${partEntry.sellUom}" is not a valid UOM code for part "${partEntry.partNumber}". ` +
              `Valid codes: ${[...validUomCodes].join(', ')}`,
          );
        }

        // Resolve vendor snapshots
        const vendors = await Promise.all(
          partEntry.vendors.map(async (pv) => {
            const vendorDoc = await partSession.load<{
              id: string;
              vendorNumber: string;
              name: string;
            }>(`vendors/${pv.vendorCode}`);
            if (!vendorDoc) {
              throw new Error(
                `Seed error: vendor "${pv.vendorCode}" not found for part "${partEntry.partNumber}"`,
              );
            }
            return {
              vendor: {
                id: vendorDoc.id,
                vendorNumber: vendorDoc.vendorNumber,
                name: vendorDoc.name,
              },
              vendorPartNumber: pv.vendorPartNumber,
              isPrimary: pv.isPrimary,
              cost: pv.cost,
            };
          }),
        );

        // Resolve location + bin snapshots
        const locations = await Promise.all(
          partEntry.locations.map(async (pl) => {
            const locationDoc = await partSession.load<{
              id: string;
              name: string;
              displayName?: string;
            }>(`locations/${pl.locationName}`);
            if (!locationDoc) {
              throw new Error(
                `Seed error: location "${pl.locationName}" not found for part "${partEntry.partNumber}"`,
              );
            }

            const bins = await Promise.all(
              pl.bins.map(async (b, binIdx) => {
                const binId = `bins/${pl.locationName}/${b.binCode}`;
                const binDoc = await partSession.load<{
                  id: string;
                  binNumber: string;
                  description?: string;
                }>(binId);
                if (!binDoc) {
                  throw new Error(
                    `Seed error: bin "${binId}" not found for part "${partEntry.partNumber}"`,
                  );
                }
                return {
                  bin: {
                    id: binDoc.id,
                    binNumber: binDoc.binNumber,
                    description: binDoc.description,
                  },
                  numOnHand: b.numOnHand,
                  isMain: binIdx === 0,
                };
              }),
            );

            const numOnHand = bins.reduce((sum, b) => sum + b.numOnHand, 0);
            const numAvailable = numOnHand + pl.numOnOrder - pl.numCommitted;
            return {
              location: {
                id: locationDoc.id,
                name: locationDoc.name,
                displayName: locationDoc.displayName,
              },
              numOnHand,
              numCommitted: pl.numCommitted,
              numSpecialOrderCommitted: 0,
              numOnOrder: pl.numOnOrder,
              numBackordered: 0,
              numAvailable,
              listPrice: pl.listPrice,
              bins,
            };
          }),
        );

        const totalOnHand = locations.reduce((s, l) => s + l.numOnHand, 0);
        const totalCommitted = locations.reduce((s, l) => s + l.numCommitted, 0);
        const totalOnOrder = locations.reduce((s, l) => s + l.numOnOrder, 0);
        const totalBackordered = 0;
        const totalSpecialOrderCommitted = 0;
        const totalAvailable = totalOnHand + totalOnOrder - totalCommitted;
        const totalNetAvailable = totalAvailable - totalSpecialOrderCommitted;

        await partSession.store(
          {
            id: docId,
            partNumber: partEntry.partNumber,
            description: partEntry.description,
            sellUom: partEntry.sellUom,
            listPrice: partEntry.listPrice,
            status: 'active',
            retireReason: undefined,
            supersededByPartId: undefined,
            totalOnHand,
            totalCommitted,
            totalSpecialOrderCommitted,
            totalOnOrder,
            totalBackordered,
            totalAvailable,
            totalNetAvailable,
            vendors,
            locations,
            createdDate: now,
            updatedDate: now,
            version: 1,
            isDeleted: false,
          },
          docId,
        );

        await partSession.saveChanges();
      } finally {
        partSession.dispose();
      }
    }

    console.log(
      `Seed complete: ${unitOfMeasurementSeedData.length} uoms, ` +
        `${glGroupSeedData.length} gl-groups, ${taxCodeSeedData.length} tax-codes, ` +
        `${saleCategorySeedData.length} sale-categories, ${groupCodeSeedData.length} group-codes, ` +
        `${shipWeightCodeSeedData.length} ship-weight-codes, ` +
        `${partStatusCodeSeedData.length} part-status-codes, ` +
        `${locationSeedData.length} locations, ${vendorSeedData.length} vendors, ${binSeedData.length} bins, ` +
        `${userSeedData.length} users, ` +
        `${partLocationSeedData.length} part-locations, ${partVendorSeedData.length} part-vendors, ` +
        `${partSeedData.length} parts.`,
    );
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    session.dispose();
    store.dispose();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
