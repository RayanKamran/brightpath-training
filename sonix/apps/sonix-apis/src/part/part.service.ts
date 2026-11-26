import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Money,
  type PagedResponseDto,
  toPagedDto,
} from '@dms/data-models';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type {IDocumentQuery, QueryStatistics} from 'ravendb';
import {createDmsBaseEntity} from '../common/entities/dms-base.entity';
import {RavenDocumentStoreProvider} from '../infrastructure/ravendb/document-store.provider';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import type {PartCreateDto, PartCreateResponseDto} from './dto/part-create.dto';
import type {PartDetailResponseDto} from './dto/part-detail.dto';
import type {PartWithInventoryResponseDto} from './dto/part-list.query.dto';
import {
  type BinSnapshot,
  type LocationBin,
  type LocationSnapshot,
  Part,
  type PartLocation,
  PartStatus,
  type PartVendor,
  type VendorSnapshot,
} from './entities/part.entity';
import {Parts_Search} from './indexes/parts-search.index';
import {toPartDetailResponseDto, toPartWithInventoryResponseDtoList} from './part.mapper';

@Injectable()
export class PartService implements OnModuleInit {
  private readonly _logger = new Logger(PartService.name);

  public constructor(
    private readonly _storeProvider: RavenDocumentStoreProvider,
    private readonly _sessionFactory: RavenSessionFactory,
  ) {}

  public async onModuleInit(): Promise<void> {
    try {
      await new Parts_Search().execute(this._storeProvider.getStore());
    } catch (error) {
      this._logger.warn(
        'Failed to create Parts/Search index — database may not exist yet',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Creates a part (DMSMOD-15). Every rule is checked and every referenced record is read before
   * the single write, so a rejected create writes nothing (spec: Single Atomic Write).
   *
   * 400 — cross-field, vendor or bin rules, unknown vendor or bin; 404 — unknown location;
   * 409 — a non-deleted part with this part number exists.
   */
  public async create(dto: PartCreateDto, userId: string): Promise<PartCreateResponseDto> {
    const errors: string[] = [
      ...this._fieldRuleErrors(dto),
      ...this._vendorRuleErrors(dto),
      ...this._binRuleErrors(dto),
    ];
    if (errors.length > 0) {
      throw new BadRequestException({message: errors, error: 'Bad Request'});
    }

    const id = `parts/${dto.partNumber}`;
    using session = this._sessionFactory.openSession();

    const existing = await session.load<Part>(id);
    if (existing && !existing.isDeleted) {
      throw new ConflictException(`Part ${dto.partNumber} already exists`);
    }

    const vendorDocs = await session.load<VendorSnapshot>(
      dto.vendors.map((v) => `vendors/${v.vendorNumber}`),
    );
    const missingVendors = dto.vendors.filter((v) => !vendorDocs[`vendors/${v.vendorNumber}`]);
    if (missingVendors.length > 0) {
      throw new BadRequestException({
        message: missingVendors.map(
          (v) => `vendors The Vendor code is not valid: ${v.vendorNumber}`,
        ),
        error: 'Bad Request',
      });
    }

    const locations: PartLocation[] = [];
    if (dto.locationId) {
      const bareLocationId = dto.locationId.replace(/^locations\//, '');
      const locationDoc = await session.load<LocationSnapshot>(`locations/${bareLocationId}`);
      if (!locationDoc) {
        throw new NotFoundException(`Location ${dto.locationId} not found`);
      }
      const binDtos = dto.bins ?? [];
      const binId = (code: string): string => `bins/${bareLocationId}/${code}`;
      const binDocs =
        binDtos.length > 0
          ? await session.load<BinSnapshot>(binDtos.map((b) => binId(b.binCode)))
          : {};
      const missingBins = binDtos.filter((b) => !binDocs[binId(b.binCode)]);
      if (missingBins.length > 0) {
        throw new BadRequestException({
          message: missingBins.map(
            (b) => `bins The bin code is not valid at this location: ${b.binCode}`,
          ),
          error: 'Bad Request',
        });
      }

      const onHand = dto.onHandQty ?? 0;
      const bins: LocationBin[] = binDtos.map((b) => {
        const doc = binDocs[binId(b.binCode)] as BinSnapshot;
        return {
          bin: {id: doc.id, binNumber: doc.binNumber, description: doc.description},
          // All initial stock goes in the main bin, so the bins add up to the location's on-hand.
          numOnHand: b.isMain ? onHand : 0,
          isMain: b.isMain,
        };
      });
      locations.push({
        location: {
          id: locationDoc.id,
          name: locationDoc.name,
          displayName: locationDoc.displayName,
        },
        numOnHand: onHand,
        numCommitted: 0,
        numSpecialOrderCommitted: 0,
        numOnOrder: 0,
        numBackordered: 0,
        numAvailable: onHand,
        bins,
      });
    }

    const vendors: PartVendor[] = dto.vendors.map((v) => {
      const doc = vendorDocs[`vendors/${v.vendorNumber}`] as VendorSnapshot;
      return {
        vendor: {id: doc.id, vendorNumber: doc.vendorNumber, name: doc.name},
        vendorPartNumber: v.vendorPartNumber ?? dto.partNumber,
        isPrimary: v.isPrimary,
        // The DTO already carries cents, so no toMoney() here: it would multiply by 100 again.
        cost: usd(v.cost ?? 0),
      };
    });
    const primary = vendors.find((v) => v.isPrimary) as PartVendor;

    const part: Part = {
      ...createDmsBaseEntity(userId),
      id,
      partNumber: dto.partNumber,
      description: dto.description,
      status: (dto.status as PartStatus | undefined) ?? PartStatus.Active,
      vendorPartNumber: primary.vendorPartNumber,
      sellUom: dto.sellUom,
      purchaseUom: dto.purchaseUom,
      salePurchaseRatio: dto.salePurchaseRatio,
      listPrice: usd(dto.listPrice ?? 0),
      avgCost: primary.cost ?? usd(0),
      priceGroup: dto.priceGroup,
      glGroup: dto.glGroup,
      taxCode: dto.taxCode,
      pogNumber: dto.pogNumber?.toUpperCase(),
      popCode: dto.popCode,
      comments: dto.comments,
      shippingWeight: dto.shippingWeight,
      shippingUnit: dto.shippingUnit,
      caseQty: dto.caseQty,
      minQty: dto.minQty,
      maxQty: dto.maxQty,
      minDays: dto.minDays,
      minOrder: dto.minOrder,
      bypassPriceUpdate: dto.bypassPriceUpdate ?? false,
      promptForSerialNumber: dto.serialized ?? false,
      alternatePartNumbers: dto.alternatePartNumbers ?? [],
      vendors,
      locations,
      ...rollupTotals(locations),
    };

    // A soft-deleted part with this number is replaced: reuse the tracked document.
    const toStore = existing ? Object.assign(existing, stripUndefined(part)) : stripUndefined(part);
    await session.store(toStore, id);
    await session.saveChanges();

    return {
      partNumber: part.partNumber,
      description: part.description,
      locationId: dto.locationId ?? null,
    };
  }

  private _fieldRuleErrors(dto: PartCreateDto): string[] {
    const errors: string[] = [];
    const statuses = Object.values(PartStatus) as string[];
    if (dto.status !== undefined && !statuses.includes(dto.status)) {
      errors.push(`status must be one of ${statuses.join(', ')}`);
    }
    if (dto.minQty !== undefined && dto.maxQty !== undefined && dto.maxQty < dto.minQty) {
      errors.push('maxQty must be greater than or equal to minQty');
    }
    if (dto.shippingWeight !== undefined && dto.shippingWeight > 0 && !dto.shippingUnit) {
      errors.push('shippingUnit is required when shippingWeight is greater than 0');
    }
    return errors;
  }

  private _vendorRuleErrors(dto: PartCreateDto): string[] {
    const errors: string[] = [];
    const primaries = dto.vendors.filter((v) => v.isPrimary).length;
    if (primaries !== 1) {
      errors.push(`vendors must have exactly one primary vendor (found ${primaries})`);
    }
    const numbers = dto.vendors.map((v) => v.vendorNumber);
    if (new Set(numbers).size !== numbers.length) {
      errors.push('vendors must not repeat a vendor number');
    }
    return errors;
  }

  private _binRuleErrors(dto: PartCreateDto): string[] {
    const bins = dto.bins ?? [];
    if (bins.length === 0) {
      return [];
    }
    const errors: string[] = [];
    if (!dto.locationId) {
      errors.push('bins need a locationId');
    }
    const mains = bins.filter((b) => b.isMain).length;
    if (mains !== 1) {
      errors.push(`bins must have exactly one main bin (found ${mains})`);
    }
    const codes = bins.map((b) => b.binCode);
    if (new Set(codes).size !== codes.length) {
      errors.push('bins must not repeat a bin code');
    }
    return errors;
  }

  public async findOne(partNumber: string): Promise<PartDetailResponseDto> {
    using session = this._sessionFactory.openSession();
    const part = await session.load<Part>(`parts/${partNumber}`);
    if (!part || part.isDeleted) {
      throw new NotFoundException(`Part with part number ${partNumber} not found`);
    }

    return toPartDetailResponseDto(part);
  }

  /**
   * Returns a paginated list of parts with inventory quantities for a given location.
   *
   * On-hand quantity — how it works
   * ─────────────────────────────────
   * The Part document stores two layers of on-hand data:
   *
   *   1. `Part.totalOnHand`          — rollup across ALL locations (sum of locations[i].numOnHand).
   *      Written on every create/update that touches inventory. Used for cross-location totals.
   *
   *   2. `PartLocation.numOnHand`    — on-hand at one specific location (sum of that location's
   *      bins[j].numOnHand). Stored inline in Part.locations[].
   *
   * The list response exposes both:
   *   - `totalOnHand`    → Part.totalOnHand       (all-location rollup, read directly from doc)
   *   - `locationOnHand` → PartLocation.numOnHand (scoped to the requested locationId)
   *
   * The mapper (toPartWithInventoryResponseDto) resolves `locationOnHand` by finding the
   * PartLocation entry whose location.id matches the requested locationId. If no matching
   * entry exists the field is null.
   *
   * There is no aggregation at query time — quantities are pre-computed and stored on the
   * document on every write, so the list query is a pure read with no arithmetic.
   */
  public async findAllWithInventory(query: {
    locationId: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponseDto<PartWithInventoryResponseDto>> {
    const {
      locationId: rawLocationId,
      searchTerm,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const locationId: string = rawLocationId.startsWith('locations/')
      ? rawLocationId
      : `locations/${rawLocationId}`;

    const skip: number = (page - 1) * pageSize;

    using session = this._sessionFactory.openSession();
    let q: IDocumentQuery<Part> = session
      .query<Part>({indexName: 'Parts/Search'})
      .whereEquals('isDeleted', false);

    // Parts/Search index stores a flat `locationIds` array so we can filter
    // with a single equality check rather than querying nested location objects.
    q = q.whereEquals('locationIds', locationId);

    if (searchTerm?.trim() && searchTerm.trim().length >= 2) {
      q = q.search('query', `${searchTerm.trim()}*`, 'AND');
    }

    q = q.orderBy('partNumber');

    let stats!: QueryStatistics;
    const parts = await q
      .statistics((s) => {
        stats = s;
      })
      .skip(skip)
      .take(pageSize)
      .all();

    return toPagedDto(
      toPartWithInventoryResponseDtoList(parts, locationId),
      page,
      pageSize,
      stats.totalResults,
    );
  }
}

function usd(amount: number): Money {
  return {amount, currency: 'USD'};
}

/** Rollups across locations, recomputed on every write. */
function rollupTotals(locations: PartLocation[]) {
  const sum = (pick: (l: PartLocation) => number): number =>
    locations.reduce((s, l) => s + pick(l), 0);
  const totalOnHand = sum((l) => l.numOnHand);
  const totalCommitted = sum((l) => l.numCommitted);
  const totalSpecialOrderCommitted = sum((l) => l.numSpecialOrderCommitted);
  const totalOnOrder = sum((l) => l.numOnOrder);
  const totalBackordered = sum((l) => l.numBackordered);
  const totalAvailable = totalOnHand + totalOnOrder - totalCommitted;
  return {
    totalOnHand,
    totalCommitted,
    totalSpecialOrderCommitted,
    totalOnOrder,
    totalBackordered,
    totalAvailable,
    totalNetAvailable: totalAvailable - totalSpecialOrderCommitted,
  };
}

/** Optional fields that were not sent are left off the document, not stored as undefined. */
function stripUndefined<T extends object>(entity: T): T {
  return Object.fromEntries(Object.entries(entity).filter(([, v]) => v !== undefined)) as T;
}
