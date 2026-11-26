import type {
  PartDetailBinDto,
  PartDetailResponseDto,
  PartDetailVendorDto,
} from './dto/part-detail.dto';
import type {PartWithInventoryResponseDto} from './dto/part-list.query.dto';
import type {LocationBin, Part, PartLocation, PartVendor} from './entities/part.entity';

/**
 * Maps a Part document to the list-row DTO.
 *
 * On-hand quantity fields
 * ────────────────────────
 * `totalOnHand`    — read directly from Part.totalOnHand. This is a pre-computed rollup
 *                    stored on every write; it equals the sum of all PartLocation.numOnHand
 *                    values across every location the part exists in.
 *
 * `locationOnHand` — read from the PartLocation entry whose location.id matches the
 *                    requested locationId. Returns null if the part has no entry for that
 *                    location. This value itself equals the sum of LocationBin.numOnHand
 *                    across all bins at that location (pre-computed on write).
 *
 * `primaryBinNumber` — the bin marked isMain on the matched PartLocation. Falls back to
 *                      bins[0] if none is explicitly flagged. Null when the location has
 *                      no bins.
 *
 * No arithmetic happens here — all quantities are read directly from stored fields.
 */
export function toPartWithInventoryResponseDto(
  part: Part,
  locationId?: string,
): PartWithInventoryResponseDto {
  const partLocation: PartLocation | undefined = locationId
    ? part.locations?.find((pl) => pl.location.id === locationId)
    : part.locations?.[0];

  const primaryVendor: PartVendor | undefined = part.vendors?.find((pv) => pv.isPrimary);
  const primaryBin: LocationBin | undefined =
    partLocation?.bins?.find((b) => b.isMain) ?? partLocation?.bins?.[0];

  return {
    id: part.id,
    partNumber: part.partNumber,
    description: part.description,
    status: part.status,
    listPrice: part.listPrice ?? null,
    sellUom: part.sellUom ?? null,
    totalOnHand: part.totalOnHand,
    totalCommitted: part.totalCommitted,
    totalSpecialOrderCommitted: part.totalSpecialOrderCommitted,
    totalOnOrder: part.totalOnOrder,
    totalBackordered: part.totalBackordered,
    totalAvailable: part.totalAvailable,
    totalNetAvailable: part.totalNetAvailable,
    primaryVendorName: primaryVendor?.vendor?.name ?? null,
    primaryVendorPartNumber: primaryVendor?.vendorPartNumber ?? null,
    primaryBinNumber: primaryBin?.bin?.binNumber ?? null,
    locationOnHand: partLocation?.numOnHand ?? null,
    locationCommitted: partLocation?.numCommitted ?? null,
    locationOnOrder: partLocation?.numOnOrder ?? null,
    createdDate: part.createdDate,
    updatedDate: part.updatedDate,
  };
}

export function toPartWithInventoryResponseDtoList(
  parts: Part[],
  locationId?: string,
): PartWithInventoryResponseDto[] {
  return parts.map((part) => toPartWithInventoryResponseDto(part, locationId));
}

export function toPartDetailResponseDto(part: Part, locationId?: string): PartDetailResponseDto {
  const base = toPartWithInventoryResponseDto(part, locationId);

  const partLocation: PartLocation | undefined = locationId
    ? part.locations?.find((pl) => pl.location.id === locationId)
    : part.locations?.[0];

  const bins: PartDetailBinDto[] = (partLocation?.bins ?? []).map((b, i) => ({
    binNumber: b.bin?.binNumber ?? '',
    description: b.bin?.description ?? null,
    isMain: b.isMain ?? i === 0,
  }));

  const vendors: PartDetailVendorDto[] = (part.vendors ?? []).map((pv) => ({
    vendorNumber: pv.vendor?.vendorNumber ?? '',
    vendorName: pv.vendor?.name ?? '',
    vendorPartNumber: pv.vendorPartNumber ?? null,
    cost: pv.cost ?? null,
    isPrimary: pv.isPrimary,
  }));

  return {
    ...base,
    purchaseUom: part.purchaseUom ?? null,
    salePurchaseRatio: part.salePurchaseRatio ?? null,
    comments: part.comments ?? null,
    shippingWeight: part.shippingWeight ?? null,
    shippingUnit: part.shippingUnit ?? null,
    caseQty: part.caseQty ?? null,
    minQty: part.minQty ?? null,
    maxQty: part.maxQty ?? null,
    minDays: part.minDays ?? null,
    minOrder: part.minOrder ?? null,
    bypassPriceUpdate: part.bypassPriceUpdate ?? false,
    promptForSerialNumber: part.promptForSerialNumber ?? false,
    avgCost: part.avgCost ?? null,
    priceGroup: part.priceGroup ?? null,
    glGroup: part.glGroup ?? null,
    taxCode: part.taxCode ?? null,
    pogNumber: part.pogNumber ?? null,
    popCode: part.popCode ?? null,
    alternatePartNumbers: part.alternatePartNumbers ?? [],
    lastReceived: part.lastReceived ?? null,
    lastSold: part.lastSold ?? null,
    bins,
    vendors,
  };
}
