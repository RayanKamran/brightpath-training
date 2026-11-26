import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import type {LocationBaseResponseDto} from '../dto/location-base.dto';
import {Location} from '../entities/location.entity';
import {LocationsCacheService} from '../locations-cache.service';

function createMockSession(locations: Location[] = []) {
  const session = {
    load: vi.fn(),
    store: vi.fn(),
    saveChanges: vi.fn(),
    dispose: vi.fn(),
    query: vi.fn().mockReturnValue({all: vi.fn().mockResolvedValue(locations)}),
    [Symbol.dispose]() {
      (this as {dispose: () => void}).dispose();
    },
  };
  return session;
}

function createMockSessionFactory(session: ReturnType<typeof createMockSession>) {
  return {openSession: vi.fn().mockReturnValue(session)} as unknown as RavenSessionFactory;
}

const makeLocation = (overrides: Partial<Location> = {}): Location =>
  Object.assign(new Location(), {
    id: 'loc-1',
    name: 'Location1',
    displayName: 'Location 1',
    logtoId: 'logto-1',
    description: null,
    active: true,
    createdBy: 'system',
    updatedBy: 'system',
    createdDate: new Date(),
    updatedDate: new Date(),
    isDeleted: false,
    version: 1,
    ...overrides,
  });

describe('LocationsCacheService', () => {
  let service: LocationsCacheService;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    session = createMockSession();
    service = new LocationsCacheService(createMockSessionFactory(session));
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loadLocations', () => {
    const mockLocations: Location[] = [
      makeLocation({id: 'loc-1', name: 'Location1', logtoId: 'logto-1'}),
      makeLocation({id: 'loc-2', name: 'Location2', logtoId: 'logto-2'}),
    ];

    it('should load locations from database', async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(mockLocations)});

      await service.loadLocations();

      const cacheInfo = service.getCacheInfo();
      expect(cacheInfo.count).toBe(2);
      expect(cacheInfo.isLoading).toBe(false);
    });

    it('should skip loading if already in progress', async () => {
      let resolveQuery!: (v: Location[]) => void;
      const slowPromise = new Promise<Location[]>((res) => {
        resolveQuery = res;
      });
      session.query.mockReturnValue({all: vi.fn().mockReturnValue(slowPromise)});

      const promise1: Promise<void> = service.loadLocations();
      const promise2: Promise<void> = service.loadLocations(); // should be skipped

      resolveQuery(mockLocations);
      await promise1;
      await promise2;

      expect(session.query).toHaveBeenCalledTimes(1);
    });

    it('should handle load failure gracefully (swallows error, returns empty cache)', async () => {
      session.query.mockReturnValue({all: vi.fn().mockRejectedValue(new Error('Database error'))});

      await service.loadLocations(); // should not throw

      const cacheInfo = service.getCacheInfo();
      expect(cacheInfo.count).toBe(0);
      expect(cacheInfo.isLoading).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should reload locations', async () => {
      const locations: Location[] = [makeLocation()];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});

      await service.refresh();

      expect(service.getCacheInfo().count).toBe(1);
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([makeLocation()])});
      await service.loadLocations();
    });

    it('should return location by ID', () => {
      const result: LocationBaseResponseDto | null = service.getById('loc-1');

      expect(result).toEqual({
        id: 'loc-1',
        name: 'Location1',
        displayName: 'Location 1',
        logtoId: 'logto-1',
        description: null,
        active: true,
        addresses: [],
        contacts: [],
      });
    });

    it('should return null for non-existent ID', () => {
      const result: LocationBaseResponseDto | null = service.getById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getByName', () => {
    beforeEach(async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([makeLocation()])});
      await service.loadLocations();
    });

    it('should return location by name (case-insensitive)', () => {
      const result: LocationBaseResponseDto | null = service.getByName('location1');

      expect(result?.name).toBe('Location1');
    });

    it('should handle uppercase search', () => {
      const result: LocationBaseResponseDto | null = service.getByName('LOCATION1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Location1');
    });

    it('should return null for non-existent name', () => {
      const result: LocationBaseResponseDto | null = service.getByName('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByLogtoId', () => {
    beforeEach(async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([makeLocation()])});
      await service.loadLocations();
    });

    it('should return location by Logto ID', () => {
      const result: LocationBaseResponseDto | null = service.getByLogtoId('logto-1');

      expect(result).toEqual({
        id: 'loc-1',
        name: 'Location1',
        displayName: 'Location 1',
        logtoId: 'logto-1',
        description: null,
        active: true,
        addresses: [],
        contacts: [],
      });
    });

    it('should return null for non-existent Logto ID', () => {
      const result: LocationBaseResponseDto | null = service.getByLogtoId('logto-999');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const locations: Location[] = [
        makeLocation({id: 'loc-1', name: 'Location1'}),
        makeLocation({id: 'loc-2', name: 'Location2', logtoId: 'logto-2'}),
      ];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});
      await service.loadLocations();
    });

    it('should return all cached locations', () => {
      const result: LocationBaseResponseDto[] = service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('nameLower');
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([makeLocation()])});
      await service.loadLocations();
    });

    it('should return true for existing location', () => {
      expect(service.exists('loc-1')).toBe(true);
    });

    it('should return false for non-existent location', () => {
      expect(service.exists('loc-999')).toBe(false);
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information', async () => {
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([makeLocation()])});
      await service.loadLocations();

      const cacheInfo = service.getCacheInfo();

      expect(cacheInfo).toHaveProperty('count');
      expect(cacheInfo).toHaveProperty('lastLoadedAt');
      expect(cacheInfo).toHaveProperty('isLoading');
      expect(cacheInfo.count).toBe(1);
      expect(cacheInfo.isLoading).toBe(false);
      expect(cacheInfo.lastLoadedAt).toBeInstanceOf(Date);
    });
  });
});
