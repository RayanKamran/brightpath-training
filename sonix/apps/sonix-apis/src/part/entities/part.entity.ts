import type {Money} from '@dms/data-models';
import {DmsBaseEntity} from '../../common/entities/dms-base.entity';

/**
 * PartStatus — lifecycle states for a Part document.
 */
export enum PartStatus {
  Active = 'active',
  Inactive = 'inactive',
  Discontinued = 'discontinued',
  Retired = 'retired',
}

/**
 * RetireReason — reason recorded when retiring a part.
 */
export enum RetireReason {
  Obsolete = 'obsolete',
  Superseded = 'superseded',
  DoNotSell = 'do-not-sell',
}

/**
 * VendorSnapshot — vendor data embedded inside a PartVendor record.
 * Stored inline so reads never require a cross-document lookup on the vendors collection.
 * The snapshot must be refreshed whenever the referenced Vendor document changes.
 */
export type VendorSnapshot = {
  id: string;
  vendorNumber: string;
  name: string;
};

/**
 * LocationSnapshot — location data embedded inside a PartLocation record.
 */
export type LocationSnapshot = {
  id: string;
  name: string;
  displayName?: string;
};

/**
 * BinSnapshot — bin data embedded inside a LocationBin record.
 */
export type BinSnapshot = {
  id: string;
  binNumber: string;
  description?: string;
};

/**
 * LocationBin — on-hand quantity for a specific bin within a PartLocation.
 * Embedded inside PartLocation.bins[].
 */
export class LocationBin {
  public bin!: BinSnapshot;

  /** Quantity of this part currently in this bin. */
  public numOnHand!: number;

  /** Exactly one bin per PartLocation must have isMain = true. */
  public isMain!: boolean;
}

/**
 * PartVendor — vendor relationship embedded in the Part document.
 * Stores a VendorSnapshot so reads need no cross-collection lookups.
 */
export class PartVendor {
  public vendor!: VendorSnapshot;

  public vendorPartNumber?: string;

  /** Exactly one PartVendor per Part must have isPrimary = true when vendors is non-empty. */
  public isPrimary!: boolean;

  public cost?: Money;
}

/**
 * PartLocation — location-specific inventory record embedded in the Part document.
 *
 * Document-store design — no JOINs:
 * - location is embedded as a LocationSnapshot.
 * - bins[] are the individual physical storage allocations.
 *
 * Computed on every write:
 * - numOnHand   = sum(bins[i].numOnHand)
 * - numAvailable = (numOnHand + numOnOrder − numCommitted)
 */
export class PartLocation {
  public location!: LocationSnapshot;

  /** Computed: sum of bins[i].numOnHand. Set on every write. */
  public numOnHand!: number;

  public numCommitted!: number;

  /** Quantity committed for special/customer orders at this location. */
  public numSpecialOrderCommitted!: number;

  public numOnOrder!: number;

  /** Quantity backordered at this location. */
  public numBackordered!: number;

  /** Computed: (numOnHand + numOnOrder) − numCommitted. Set on every write. */
  public numAvailable!: number;

  /** Optional location-level list price override. Falls back to Part.listPrice. */
  public listPrice?: Money;

  public bins!: LocationBin[];
}

/**
 * Part — aggregate root.
 *
 * Document-store design:
 * - Vendors and per-location inventory records are embedded as owned children.
 * - No cross-document lookups are required for standard reads.
 * - Rollup totals are recomputed and stored on every write.
 *
 * RavenDB document ID: parts/{partNumber}
 */
export class Part extends DmsBaseEntity {
  public partNumber!: string;

  /** Convenience field — mirrors the primary vendor's vendorPartNumber for quick display. */
  public vendorPartNumber?: string;

  public description!: string;

  /** Unit of measure (e.g. EA, QT, LB, GAL, SET). Kept for backwards compatibility. */
  public unitOfMeasure?: string;

  /** Sell unit of measure (e.g. EA, SET). */
  public sellUom?: string;

  /** Purchase unit of measure (e.g. EA, SET). */
  public purchaseUom?: string;

  /** Sale-to-purchase ratio (how many sell units equal one purchase unit). */
  public salePurchaseRatio?: number;

  /** Internal notes / comments. */
  public comments?: string;

  /** Shipping weight in pounds. */
  public shippingWeight?: number;

  /** Shipping unit descriptor (e.g. BOX, PALLET). */
  public shippingUnit?: string;

  /** Restocking: standard case quantity. */
  public caseQty?: number;

  /** Restocking: minimum stocking quantity. */
  public minQty?: number;

  /** Restocking: maximum stocking quantity. */
  public maxQty?: number;

  /** Restocking: minimum days of supply. */
  public minDays?: number;

  /** Restocking: minimum order quantity. */
  public minOrder?: number;

  /** When true, price updates from vendor feeds are bypassed. */
  public bypassPriceUpdate?: boolean;

  /** When true, the system prompts for a serial number on sale. */
  public promptForSerialNumber?: boolean;

  /** Average cost (weighted moving average). */
  public avgCost?: Money;

  /** Price group code for price-level logic. */
  public priceGroup?: string;

  /** General ledger group code. */
  public glGroup?: string;

  /** Tax code for taxable parts. */
  public taxCode?: string;

  /** POG number. */
  public pogNumber?: string;

  /** POP code. */
  public popCode?: string;

  public listPrice?: Money;

  public status!: PartStatus;

  public retireReason?: RetireReason;

  /** Set when retireReason === RetireReason.Superseded. Points to the replacement Part id. */
  public supersededByPartId?: string;

  /** Computed: sum of locations[i].numOnHand. Set on every write. */
  public totalOnHand!: number;

  /** Computed: sum of locations[i].numCommitted. Set on every write. */
  public totalCommitted!: number;

  /** Computed: sum of locations[i].numSpecialOrderCommitted. Set on every write. */
  public totalSpecialOrderCommitted!: number;

  /** Computed: sum of locations[i].numOnOrder. Set on every write. */
  public totalOnOrder!: number;

  /** Computed: sum of locations[i].numBackordered. Set on every write. */
  public totalBackordered!: number;

  /** Computed: (totalOnHand + totalOnOrder) − totalCommitted. Set on every write. */
  public totalAvailable!: number;

  /** Computed: totalAvailable − totalSpecialOrderCommitted. Set on every write. */
  public totalNetAvailable!: number;

  /** Date this part was last received (stamped by PO receiving). */
  public lastReceived?: Date;

  /** Date this part was last sold (stamped by invoice/work order). */
  public lastSold?: Date;

  public alternatePartNumbers?: string[];

  public vendors!: PartVendor[];

  public locations!: PartLocation[];
}
