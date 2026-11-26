import {Injectable, Logger} from '@nestjs/common';
import {binSeedData} from '../../../../database/seeds/data/bin.data.js';
import {locationSeedData} from '../../../../database/seeds/data/location.data.js';
import {partSeedData} from '../../../../database/seeds/data/part.data.js';
import {unitOfMeasurementSeedData} from '../../../../database/seeds/data/uom.data.js';
import {userSeedData} from '../../../../database/seeds/data/user.data.js';
import {vendorSeedData} from '../../../../database/seeds/data/vendor.data.js';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';

export type SeedResult = {
  uoms: number;
  locations: number;
  vendors: number;
  bins: number;
  users: number;
  partLocations: number;
  partVendors: number;
  parts: number;
};

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

@Injectable()
export class AdminSeedService {
  private readonly _logger = new Logger(AdminSeedService.name);

  public constructor(private readonly _sessionFactory: RavenSessionFactory) {}

  public async seed(): Promise<SeedResult> {
    const session = this._sessionFactory.openSession();
    const now = new Date();

    try {
      // ── 1. UOMs ────────────────────────────────────────────────────────────
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

      // ── 2. Locations ───────────────────────────────────────────────────────
      const locationDocIds = locationSeedData
        .filter((l) => l.name)
        .map((l) => `locations/${l.name}`);
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

      // ── 3. Vendors ─────────────────────────────────────────────────────────
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

      // ── 4. Bins ────────────────────────────────────────────────────────────
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

      // ── 5. Users ───────────────────────────────────────────────────────────
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

      // ── 6. Part-Locations ──────────────────────────────────────────────────
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

      // ── 7. Part-Vendors ────────────────────────────────────────────────────
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
    } finally {
      session.dispose();
    }

    // ── 8. Parts — one session per part ────────────────────────────────────
    for (const partEntry of partSeedData) {
      const partSession = this._sessionFactory.openSession();
      try {
        const docId = `parts/${partEntry.partNumber}`;

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
              pl.bins.map(async (b) => {
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
                };
              }),
            );

            const numOnHand = bins.reduce((sum, b) => sum + b.numOnHand, 0);
            const numAvailable = numOnHand - pl.numCommitted - pl.numOnOrder;
            return {
              location: {
                id: locationDoc.id,
                name: locationDoc.name,
                displayName: locationDoc.displayName,
              },
              numOnHand,
              numCommitted: pl.numCommitted,
              numOnOrder: pl.numOnOrder,
              numAvailable,
              listPrice: pl.listPrice,
              bins,
            };
          }),
        );

        const totalOnHand = locations.reduce((s, l) => s + l.numOnHand, 0);
        const totalCommitted = locations.reduce((s, l) => s + l.numCommitted, 0);
        const totalOnOrder = locations.reduce((s, l) => s + l.numOnOrder, 0);
        const totalAvailable = totalOnHand - totalCommitted - totalOnOrder;

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
            totalOnOrder,
            totalAvailable,
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

    this._logger.log(
      `Seed complete: ${unitOfMeasurementSeedData.length} uoms, ${locationSeedData.length} locations, ` +
        `${vendorSeedData.length} vendors, ${binSeedData.length} bins, ${userSeedData.length} users, ` +
        `${partLocationSeedData.length} part-locations, ${partVendorSeedData.length} part-vendors, ${partSeedData.length} parts.`,
    );

    return {
      uoms: unitOfMeasurementSeedData.length,
      locations: locationSeedData.length,
      vendors: vendorSeedData.length,
      bins: binSeedData.length,
      users: userSeedData.length,
      partLocations: partLocationSeedData.length,
      partVendors: partVendorSeedData.length,
      parts: partSeedData.length,
    };
  }
}
