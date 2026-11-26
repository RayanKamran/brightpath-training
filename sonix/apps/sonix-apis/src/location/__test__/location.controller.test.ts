import {ForbiddenException, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {vi} from 'vitest';
import {AuthInfo} from '../../auth/auth-utils';
import type {LocationCreateResponseDto} from '../dto/location-create.dto';
import type {LocationListResponseDto} from '../dto/location-list.query.dto';
import {LocationController} from '../location.controller';
import {LocationService} from '../location.service';
import {LocationDbService} from '../location-db.service';
import {LocationsCacheService} from '../locations-cache.service';

describe('LocationController', () => {
  let controller: LocationController;
  let locationService: LocationService;
  let locationsCacheService: LocationsCacheService;

  const mockLocationService: {
    getUserLocations: ReturnType<typeof vi.fn>;
    getLocationById: ReturnType<typeof vi.fn>;
  } = {
    getUserLocations: vi.fn(),
    getLocationById: vi.fn(),
  };

  const mockLocationsCacheService: {
    refresh: ReturnType<typeof vi.fn>;
    getCacheInfo: ReturnType<typeof vi.fn>;
  } = {
    refresh: vi.fn(),
    getCacheInfo: vi.fn(),
  };

  const mockAuth = new AuthInfo(
    'test-user-id-123', // sub
    'client-id-123', // clientId
    'org-1', // organizationId
    ['read:locations', 'write:locations'], // scopes
    ['api-resource'], // audience
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
        {
          provide: LocationsCacheService,
          useValue: mockLocationsCacheService,
        },
        {
          provide: LocationDbService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    locationService = module.get<LocationService>(LocationService);
    locationsCacheService = module.get<LocationsCacheService>(LocationsCacheService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserLocations', () => {
    const mockUserLocations: LocationListResponseDto[] = [
      {
        id: 'org-1',
        name: 'ACME RV Headquarters',
        displayName: 'ACME RV Headquarters',
        logtoId: 'logto-org-1',
        description: 'Main office location',
        active: true,
        addresses: [],
        contacts: [],
        roles: [
          {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
          },
        ],
      },
      {
        id: 'org-2',
        name: 'West Coast Branch',
        displayName: 'West Coast Branch',
        logtoId: 'logto-org-2',
        description: 'West coast location',
        active: true,
        addresses: [],
        contacts: [],
        roles: [
          {
            id: 'role-2',
            name: 'User',
            description: 'Standard user role',
          },
        ],
      },
    ];

    it('should return all locations for the authenticated user', async () => {
      mockLocationService.getUserLocations.mockResolvedValue(mockUserLocations);

      const result: LocationListResponseDto[] = await controller.getUserLocations(mockAuth);

      expect(result).toEqual(mockUserLocations);
      expect(locationService.getUserLocations).toHaveBeenCalledWith('test-user-id-123');
      expect(locationService.getUserLocations).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no locations', async () => {
      mockLocationService.getUserLocations.mockResolvedValue([]);

      const result: LocationListResponseDto[] = await controller.getUserLocations(mockAuth);

      expect(result).toEqual([]);
      expect(locationService.getUserLocations).toHaveBeenCalledWith('test-user-id-123');
    });

    it('should throw InternalServerErrorException on service failure', async () => {
      mockLocationService.getUserLocations.mockRejectedValue(
        new InternalServerErrorException('Failed to fetch user locations'),
      );

      await expect(controller.getUserLocations(mockAuth)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getUserLocations(mockAuth)).rejects.toThrow(
        'Failed to fetch user locations',
      );
    });
  });

  describe('getLocationById', () => {
    const mockLocation: LocationCreateResponseDto = {
      id: 'org-1',
      name: 'ACME RV Headquarters',
      displayName: 'ACME RV Headquarters',
      logtoId: 'logto-org-1',
      description: 'Main office location',
      active: true,
      addresses: [],
      contacts: [],
    };

    it('should return location details when user has access', async () => {
      mockLocationService.getLocationById.mockResolvedValue(mockLocation);

      const result: LocationCreateResponseDto = await controller.getLocationById(mockAuth, 'org-1');

      expect(result).toEqual(mockLocation);
      expect(locationService.getLocationById).toHaveBeenCalledWith('test-user-id-123', 'org-1');
      expect(locationService.getLocationById).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new ForbiddenException('User does not have access to this location'),
      );

      await expect(controller.getLocationById(mockAuth, 'org-999')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.getLocationById(mockAuth, 'org-999')).rejects.toThrow(
        'User does not have access to this location',
      );
    });

    it('should throw NotFoundException when location does not exist', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new NotFoundException('Location org-999 not found'),
      );

      await expect(controller.getLocationById(mockAuth, 'org-999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getLocationById(mockAuth, 'org-999')).rejects.toThrow(
        'Location org-999 not found',
      );
    });

    it('should throw InternalServerErrorException on service failure', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new InternalServerErrorException('Failed to fetch location details'),
      );

      await expect(controller.getLocationById(mockAuth, 'org-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('verifyLocationAccess', () => {
    const mockLocation: LocationCreateResponseDto = {
      id: 'org-1',
      name: 'ACME RV Headquarters',
      displayName: 'ACME RV Headquarters',
      logtoId: 'logto-org-1',
      description: 'Main office location',
      active: true,
      addresses: [],
      contacts: [],
    };

    it('should return hasAccess=true with location when user has access', async () => {
      mockLocationService.getLocationById.mockResolvedValue(mockLocation);

      const result: {hasAccess: boolean; location?: LocationCreateResponseDto} =
        await controller.verifyLocationAccess(mockAuth, 'org-1');

      expect(result).toEqual({
        hasAccess: true,
        location: mockLocation,
      });
      expect(locationService.getLocationById).toHaveBeenCalledWith('test-user-id-123', 'org-1');
    });

    it('should return hasAccess=false when user does not have access', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new ForbiddenException('User does not have access to this location'),
      );

      const result: {hasAccess: boolean; location?: LocationCreateResponseDto} =
        await controller.verifyLocationAccess(mockAuth, 'org-999');

      expect(result).toEqual({hasAccess: false});
      expect(locationService.getLocationById).toHaveBeenCalledWith('test-user-id-123', 'org-999');
    });

    it('should return hasAccess=false when location does not exist', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new NotFoundException('Location not found'),
      );

      const result: {hasAccess: boolean; location?: LocationCreateResponseDto} =
        await controller.verifyLocationAccess(mockAuth, 'org-999');

      expect(result).toEqual({hasAccess: false});
    });

    it('should rethrow unexpected errors', async () => {
      mockLocationService.getLocationById.mockRejectedValue(
        new InternalServerErrorException('Service error'),
      );

      await expect(controller.verifyLocationAccess(mockAuth, 'org-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('refreshCache', () => {
    const mockCacheInfo: {count: number; lastLoadedAt: Date; isLoading: boolean} = {
      count: 5,
      lastLoadedAt: new Date('2026-01-01T10:00:00Z'),
      isLoading: false,
    };

    it('should refresh cache and return success with cache info', async () => {
      mockLocationsCacheService.refresh.mockResolvedValue(undefined);
      mockLocationsCacheService.getCacheInfo.mockReturnValue(mockCacheInfo);

      const result: {
        success: boolean;
        message: string;
        cacheInfo: {count: number; lastLoadedAt: Date | null; isLoading: boolean};
      } = await controller.refreshCache();

      expect(result).toEqual({
        success: true,
        message: 'Cache refreshed successfully. Loaded 5 locations.',
        cacheInfo: mockCacheInfo,
      });
      expect(locationsCacheService.refresh).toHaveBeenCalledTimes(1);
      expect(locationsCacheService.getCacheInfo).toHaveBeenCalledTimes(1);
    });

    it('should handle empty cache after refresh', async () => {
      const emptyCacheInfo: {count: number; lastLoadedAt: Date; isLoading: boolean} = {
        count: 0,
        lastLoadedAt: new Date('2026-01-01T10:00:00Z'),
        isLoading: false,
      };

      mockLocationsCacheService.refresh.mockResolvedValue(undefined);
      mockLocationsCacheService.getCacheInfo.mockReturnValue(emptyCacheInfo);

      const result: {
        success: boolean;
        message: string;
        cacheInfo: {count: number; lastLoadedAt: Date | null; isLoading: boolean};
      } = await controller.refreshCache();

      expect(result).toEqual({
        success: true,
        message: 'Cache refreshed successfully. Loaded 0 locations.',
        cacheInfo: emptyCacheInfo,
      });
    });

    it('should throw error if cache refresh fails', async () => {
      mockLocationsCacheService.refresh.mockRejectedValue(new Error('Cache refresh failed'));

      await expect(controller.refreshCache()).rejects.toThrow('Cache refresh failed');
      expect(locationsCacheService.getCacheInfo).not.toHaveBeenCalled();
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information', async () => {
      const mockCacheInfo: {count: number; lastLoadedAt: Date; isLoading: boolean} = {
        count: 10,
        lastLoadedAt: new Date('2026-01-01T09:30:00Z'),
        isLoading: false,
      };

      mockLocationsCacheService.getCacheInfo.mockReturnValue(mockCacheInfo);

      const result: {count: number; lastLoadedAt: Date | null; isLoading: boolean} =
        await controller.getCacheInfo();

      expect(result).toEqual(mockCacheInfo);
      expect(locationsCacheService.getCacheInfo).toHaveBeenCalledTimes(1);
    });

    it('should return null lastLoadedAt when cache not yet loaded', async () => {
      const uninitializedCache: {count: number; lastLoadedAt: Date | null; isLoading: boolean} = {
        count: 0,
        lastLoadedAt: null,
        isLoading: false,
      };

      mockLocationsCacheService.getCacheInfo.mockReturnValue(uninitializedCache);

      const result: {count: number; lastLoadedAt: Date | null; isLoading: boolean} =
        await controller.getCacheInfo();

      expect(result).toEqual(uninitializedCache);
      expect(result.lastLoadedAt).toBeNull();
    });

    it('should return isLoading=true when cache is loading', async () => {
      const loadingCache: {count: number; lastLoadedAt: Date; isLoading: boolean} = {
        count: 5,
        lastLoadedAt: new Date('2026-01-01T09:00:00Z'),
        isLoading: true,
      };

      mockLocationsCacheService.getCacheInfo.mockReturnValue(loadingCache);

      const result: {count: number; lastLoadedAt: Date | null; isLoading: boolean} =
        await controller.getCacheInfo();

      expect(result.isLoading).toBe(true);
    });
  });
});
