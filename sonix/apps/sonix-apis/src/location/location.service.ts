import {ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import {LogtoManagementClient} from '../user/logto-management.client';
import type {LocationUserDto} from './dto/location.dto';
import type {LocationCreateResponseDto} from './dto/location-create.dto';
import type {LocationListResponseDto} from './dto/location-list.query.dto';
import {Location as LocationEntity} from './entities/location.entity';
import {toLocationCreateResponseDto, toLocationListResponseDtoList} from './location.mapper';

@Injectable()
export class LocationService {
  private readonly _logger = new Logger(LocationService.name);

  public constructor(
    private readonly _logtoClient: LogtoManagementClient,
    private readonly _sessionFactory: RavenSessionFactory,
  ) {}

  public async getUserLocations(userId: string): Promise<LocationListResponseDto[]> {
    this._logger.log(`Fetching locations for user: ${userId}`);
    const organizations = await this._logtoClient.getUserOrganizations(userId);
    if (organizations.length === 0) {
      return [];
    }

    using session = this._sessionFactory.openSession();
    const allLocations: LocationEntity[] = await session
      .query<LocationEntity>({collection: 'locations'})
      .all();
    const locationMap = new Map(
      allLocations
        .filter((location) => location.active && location.logtoId)
        .map((location) => [location.logtoId as string, location]),
    );

    const userLocationsWithNulls: (LocationUserDto | null)[] = await Promise.all(
      organizations.map(async (org) => {
        const dbLocation = locationMap.get(org.id);
        if (!dbLocation) {
          return null;
        }

        try {
          const roles = await this._logtoClient.getUserOrganizationRoles(userId, org.id);
          const userLoc: LocationUserDto = {
            id: dbLocation.id,
            name: dbLocation.name,
            displayName: dbLocation.displayName ?? null,
            logtoId: dbLocation.logtoId ?? null,
            description: dbLocation.description ?? null,
            active: dbLocation.active,
            roles: roles.map((role) => ({
              id: role.id,
              name: role.name,
              description: role.description,
              customData: role.customData,
            })),
          };
          return userLoc;
        } catch {
          const userLoc: LocationUserDto = {
            id: dbLocation.id,
            name: dbLocation.name,
            displayName: dbLocation.displayName ?? null,
            logtoId: dbLocation.logtoId ?? null,
            description: dbLocation.description ?? null,
            active: dbLocation.active,
            roles: [],
          };
          return userLoc;
        }
      }),
    );

    const filteredLocations: LocationUserDto[] = userLocationsWithNulls.filter(
      (loc): loc is LocationUserDto => loc !== null,
    );

    return toLocationListResponseDtoList(filteredLocations);
  }

  public async getLocationById(
    userId: string,
    locationId: string,
  ): Promise<LocationCreateResponseDto> {
    using session = this._sessionFactory.openSession();
    const location = await session.load<LocationEntity>(locationId);
    if (!location || !location.active) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    if (location.logtoId) {
      const userLocations: LocationListResponseDto[] = await this.getUserLocations(userId);
      const hasAccess: boolean = userLocations.some((loc) => loc.logtoId === location.logtoId);

      if (!hasAccess) {
        throw new ForbiddenException('User does not have access to this location');
      }
    }

    return toLocationCreateResponseDto(location);
  }
}
