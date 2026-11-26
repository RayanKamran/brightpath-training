import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import type {LocationBaseResponseDto as Location} from './dto/location-base.dto';
import {Location as LocationEntity} from './entities/location.entity';

interface CachedLocation extends Location {
  nameLower: string;
}

@Injectable()
export class LocationsCacheService implements OnModuleInit {
  private readonly _logger = new Logger(LocationsCacheService.name);
  private _locationsById = new Map<string, CachedLocation>();
  private _locationsByName = new Map<string, CachedLocation>();
  private _locationsByLogtoId = new Map<string, CachedLocation>();
  private _lastLoadedAt: Date | null = null;
  private _isLoading = false;

  public constructor(private readonly _sessionFactory: RavenSessionFactory) {}

  public async onModuleInit(): Promise<void> {
    await this.loadLocations();
  }

  public async loadLocations(): Promise<void> {
    if (this._isLoading) {
      return;
    }

    this._isLoading = true;
    try {
      using session = this._sessionFactory.openSession();
      const locations = await session.query<LocationEntity>({collection: 'locations'}).all();

      this._locationsById.clear();
      this._locationsByName.clear();
      this._locationsByLogtoId.clear();

      for (const location of locations.filter((item) => item.active)) {
        const cachedLocation: CachedLocation = {
          id: location.id,
          name: location.name,
          displayName: location.displayName ?? null,
          logtoId: location.logtoId ?? null,
          description: location.description ?? null,
          active: location.active,
          nameLower: location.name.toLowerCase(),
          addresses: location.addresses ?? [],
          contacts: location.contacts ?? [],
        };

        this._locationsById.set(cachedLocation.id, cachedLocation);
        this._locationsByName.set(cachedLocation.nameLower, cachedLocation);
        if (cachedLocation.logtoId) {
          this._locationsByLogtoId.set(cachedLocation.logtoId, cachedLocation);
        }
      }

      this._lastLoadedAt = new Date();
    } catch (error) {
      this._logger.warn(
        'Failed to load locations cache — starting with empty cache',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      this._isLoading = false;
    }
  }

  public async refresh(): Promise<void> {
    await this.loadLocations();
  }

  public getById(locationId: string): Location | null {
    const location: CachedLocation | undefined = this._locationsById.get(locationId);
    if (!location) {
      return null;
    }

    return {
      id: location.id,
      name: location.name,
      displayName: location.displayName,
      logtoId: location.logtoId,
      description: location.description,
      active: location.active,
      addresses: location.addresses,
      contacts: location.contacts,
    };
  }

  public getByName(name: string): Location | null {
    const location: CachedLocation | undefined = this._locationsByName.get(name.toLowerCase());
    if (!location) {
      return null;
    }

    return {
      id: location.id,
      name: location.name,
      displayName: location.displayName,
      logtoId: location.logtoId,
      description: location.description,
      active: location.active,
      addresses: location.addresses,
      contacts: location.contacts,
    };
  }

  public getByLogtoId(logtoId: string): Location | null {
    const location: CachedLocation | undefined = this._locationsByLogtoId.get(logtoId);
    if (!location) {
      return null;
    }

    return {
      id: location.id,
      name: location.name,
      displayName: location.displayName,
      logtoId: location.logtoId,
      description: location.description,
      active: location.active,
      addresses: location.addresses,
      contacts: location.contacts,
    };
  }

  public getAll(): Location[] {
    return Array.from(this._locationsById.values()).map((location: CachedLocation) => ({
      id: location.id,
      name: location.name,
      displayName: location.displayName,
      logtoId: location.logtoId,
      description: location.description,
      active: location.active,
      addresses: location.addresses ?? [],
      contacts: location.contacts ?? [],
    }));
  }

  public exists(locationId: string): boolean {
    return this._locationsById.has(locationId);
  }

  public getCacheInfo(): {count: number; lastLoadedAt: Date | null; isLoading: boolean} {
    return {
      count: this._locationsById.size,
      lastLoadedAt: this._lastLoadedAt,
      isLoading: this._isLoading,
    };
  }
}
