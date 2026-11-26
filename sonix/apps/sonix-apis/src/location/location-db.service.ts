import {DEFAULT_PAGE_SIZE, type PagedResponseDto, toPagedDto} from '@dms/data-models';
import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {createDmsBaseEntity, touchDmsBaseEntity} from '../common/entities/dms-base.entity';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import {LogtoManagementClient} from '../user/logto-management.client';
import type {LocationCreateDto, LocationCreateResponseDto} from './dto/location-create.dto';
import type {LocationUpdateDto, LocationUpdateResponseDto} from './dto/location-update.dto';
import {Location} from './entities/location.entity';
import {toLocationCreateResponseDto, toLocationCreateResponseDtoList} from './location.mapper';

@Injectable()
export class LocationDbService {
  private readonly _logger = new Logger(LocationDbService.name);

  public constructor(
    private readonly _sessionFactory: RavenSessionFactory,
    private readonly _logtoClient: LogtoManagementClient,
  ) {}

  public async create(dto: LocationCreateDto, userId: string): Promise<LocationCreateResponseDto> {
    using session = this._sessionFactory.openSession();
    const entity: Location = {
      ...createDmsBaseEntity(userId),
      id: `locations/${dto.name}`,
      name: dto.name,
      displayName: dto.displayName ?? undefined,
      logtoId: dto.logtoId ?? undefined,
      description: dto.description ?? undefined,
      active: dto.active ?? true,
      defaultCurrency: 'USD',
      addresses: dto.addresses ?? [],
      contacts: dto.contacts ?? [],
    };

    await session.store(entity, entity.id);
    await session.saveChanges();
    return toLocationCreateResponseDto(entity);
  }

  public async findAll(options?: {
    active?: boolean;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponseDto<LocationCreateResponseDto>> {
    const {active, searchTerm, page = 1, pageSize = DEFAULT_PAGE_SIZE} = options || {};

    using session = this._sessionFactory.openSession();
    const all: Location[] = await session.query<Location>({collection: 'locations'}).all();
    const filtered: Location[] = all.filter((location) => {
      const activeMatch: boolean = active === undefined ? true : location.active === active;

      const tokens: string[] | undefined = searchTerm
        ?.toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const haystack: string = [
        location.name,
        location.displayName ?? '',
        location.description ?? '',
      ]
        .join(' ')
        .toLowerCase();

      const searchMatch: boolean =
        !tokens?.length || tokens.every((token) => haystack.includes(token));
      return activeMatch && searchMatch;
    });

    filtered.sort((left, right) => left.name.localeCompare(right.name));

    const skip: number = (page - 1) * pageSize;
    const items: Location[] = filtered.slice(skip, skip + pageSize);

    return toPagedDto(toLocationCreateResponseDtoList(items), page, pageSize, filtered.length);
  }

  public async findOne(id: string): Promise<LocationCreateResponseDto> {
    const docId: string = this._toDocId(id);

    using session = this._sessionFactory.openSession();
    const location: Location | null = await session.load<Location>(docId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return toLocationCreateResponseDto(location);
  }

  public async update(
    id: string,
    dto: LocationUpdateDto,
    userId: string,
  ): Promise<LocationUpdateResponseDto> {
    const docId: string = this._toDocId(id);

    using session = this._sessionFactory.openSession();
    const location: Location | null = await session.load<Location>(docId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    Object.assign(location, dto);
    touchDmsBaseEntity(location, userId);
    await session.store(location, docId);
    await session.saveChanges();
    return toLocationCreateResponseDto(location);
  }

  public async remove(id: string, userId: string): Promise<LocationUpdateResponseDto> {
    const docId: string = this._toDocId(id);

    using session = this._sessionFactory.openSession();
    const location: Location | null = await session.load<Location>(docId);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    location.active = false;
    touchDmsBaseEntity(location, userId);
    await session.store(location, docId);
    await session.saveChanges();
    return toLocationCreateResponseDto(location);
  }

  private _toDocId(id: string): string {
    return id.startsWith('locations/') ? id : `locations/${id}`;
  }

  public async exists(id: string): Promise<boolean> {
    using session = this._sessionFactory.openSession();
    const location: Location | null = await session.load<Location>(id);
    return Boolean(location);
  }

  public async findAllActive(): Promise<Location[]> {
    using session = this._sessionFactory.openSession();
    const all: Location[] = await session.query<Location>({collection: 'locations'}).all();
    return all.filter((location) => location.active).sort((a, b) => a.name.localeCompare(b.name));
  }

  public async syncFromLogtoOrganization(
    logtoOrgId: string,
    userId: string = 'system',
  ): Promise<Location> {
    using session = this._sessionFactory.openSession();
    try {
      const logtoOrg = await this._logtoClient.getOrganization(logtoOrgId);

      const all: Location[] = await session.query<Location>({collection: 'locations'}).all();
      let location: Location | undefined = all.find(
        (candidate: Location) => candidate.logtoId === logtoOrgId,
      );
      if (location) {
        location.name = logtoOrg.name;
        location.displayName = logtoOrg.description ?? undefined;
        touchDmsBaseEntity(location, userId);
      } else {
        location = {
          ...createDmsBaseEntity(userId),
          id: `locations/${logtoOrg.name}`,
          name: logtoOrg.name,
          displayName: logtoOrg.description ?? undefined,
          logtoId: logtoOrg.id,
          active: true,
          defaultCurrency: 'USD',
        };
      }

      await session.store(location, location.id);
      await session.saveChanges();
      return location as Location;
    } catch (error) {
      this._logger.error(
        `Failed to sync location from Logto org ${logtoOrgId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  public async syncAllFromLogto(
    userId: string = 'system',
  ): Promise<{synced: number; failed: number}> {
    const organizations = await this._logtoClient.getAllOrganizations();
    this._logger.log(`Fetched ${organizations.length} organizations from Logto`);

    using session = this._sessionFactory.openSession();
    let synced: number = 0;
    let failed: number = 0;

    const existing: Location[] = await session.query<Location>({collection: 'locations'}).all();
    const byLogtoId = new Map(
      existing
        .filter((l): l is Location & {logtoId: string} => Boolean(l.logtoId))
        .map((l) => [l.logtoId, l]),
    );
    const byName = new Map(existing.map((l) => [l.name, l]));

    for (const org of organizations) {
      try {
        const location: Location | undefined = byLogtoId.get(org.id) ?? byName.get(org.name);
        if (location) {
          location.logtoId = org.id;
          location.name = org.name;
          location.displayName = org.description || location.displayName;
          touchDmsBaseEntity(location, userId);
        } else {
          const newLocation: Location = {
            ...createDmsBaseEntity(userId),
            id: `locations/${org.name}`,
            name: org.name,
            displayName: org.description || org.name,
            logtoId: org.id,
            active: true,
            defaultCurrency: 'USD',
          };
          await session.store(newLocation, newLocation.id);
        }
        synced += 1;
      } catch (error) {
        this._logger.error(
          `Failed to sync org ${org.id} (${org.name})`,
          error instanceof Error ? error.stack : String(error),
        );
        failed += 1;
      }
    }

    await session.saveChanges();

    return {synced, failed};
  }

  public async findByLogtoId(logtoId: string): Promise<Location | null> {
    using session = this._sessionFactory.openSession();
    const all: Location[] = await session.query<Location>({collection: 'locations'}).all();
    return all.find((location) => location.logtoId === logtoId) ?? null;
  }
}
