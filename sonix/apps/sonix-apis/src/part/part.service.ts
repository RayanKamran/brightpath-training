import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, type PagedResponseDto, toPagedDto} from '@dms/data-models';
import {Injectable, Logger, NotFoundException, OnModuleInit} from '@nestjs/common';
import type {IDocumentQuery, QueryStatistics} from 'ravendb';
import {RavenDocumentStoreProvider} from '../infrastructure/ravendb/document-store.provider';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import type {PartDetailResponseDto} from './dto/part-detail.dto';
import type {PartWithInventoryResponseDto} from './dto/part-list.query.dto';
import {Part} from './entities/part.entity';
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
