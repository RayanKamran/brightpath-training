import type {PagedResponseDto} from '@dms/data-models';
import {NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import {LogtoManagementClient} from '../../user/logto-management.client';
import type {LocationCreateDto, LocationCreateResponseDto} from '../dto/location-create.dto';
import type {LocationUpdateDto, LocationUpdateResponseDto} from '../dto/location-update.dto';
import {Location} from '../entities/location.entity';
import {LocationDbService} from '../location-db.service';

function createMockSession(allLocations: Location[] = []) {
  const session = {
    load: vi.fn(),
    store: vi.fn(),
    saveChanges: vi.fn(),
    dispose: vi.fn(),
    query: vi.fn().mockReturnValue({all: vi.fn().mockResolvedValue(allLocations)}),
    [Symbol.dispose]() {
      (this as {dispose: () => void}).dispose();
    },
  };
  return session;
}

function createMockSessionFactory(session: ReturnType<typeof createMockSession>) {
  return {openSession: vi.fn().mockReturnValue(session)} as unknown as RavenSessionFactory;
}

const mockLocation = (overrides: Partial<Location> = {}): Location =>
  Object.assign(new Location(), {
    id: 'locations/Loc-1',
    name: 'Loc-1',
    displayName: 'Location One',
    logtoId: 'logto-1',
    description: 'A test location',
    active: true,
    createdBy: 'user-123',
    updatedBy: 'user-123',
    createdDate: new Date(),
    updatedDate: new Date(),
    isDeleted: false,
    version: 1,
    ...overrides,
  });

describe('LocationDbService', () => {
  let service: LocationDbService;
  let session: ReturnType<typeof createMockSession>;
  let logtoClientMock: {
    getOrganization: ReturnType<typeof vi.fn>;
    getAllOrganizations: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    session = createMockSession();
    logtoClientMock = {
      getOrganization: vi.fn(),
      getAllOrganizations: vi.fn(),
    };
    const sessionFactory: RavenSessionFactory = createMockSessionFactory(session);
    service = new LocationDbService(
      sessionFactory,
      logtoClientMock as unknown as LogtoManagementClient,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId: string = 'user-123';
    const dto: LocationCreateDto = {
      name: 'New-Location',
      displayName: 'New Location',
      logtoId: 'logto-org-1',
      description: null,
      active: true,
    };

    it('should create a location and return response dto', async () => {
      const result: LocationCreateResponseDto = await service.create(dto, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({name: 'New-Location', active: true}),
        'locations/New-Location',
      );
      expect(session.saveChanges).toHaveBeenCalled();
      expect(result.name).toBe('New-Location');
    });

    it('should set active to false when specified', async () => {
      await service.create({...dto, active: false}, userId);

      expect(session.store).toHaveBeenCalledWith(
        expect.objectContaining({active: false}),
        expect.any(String),
      );
    });

    it('should bubble raw error for global filter to handle', async () => {
      session.saveChanges.mockRejectedValue(new Error('Store failed'));

      await expect(service.create(dto, userId)).rejects.toThrow('Store failed');
    });
  });

  describe('findAll', () => {
    it('should return paginated locations', async () => {
      const locations: Location[] = [
        mockLocation({name: 'A'}),
        mockLocation({id: 'locations/B', name: 'B'}),
      ];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});

      const result: PagedResponseDto<LocationCreateResponseDto> = await service.findAll({
        page: 1,
        pageSize: 50,
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should filter by active status', async () => {
      const locations: Location[] = [
        mockLocation({active: true}),
        mockLocation({id: 'locations/X', name: 'X', active: false}),
      ];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});

      const result: PagedResponseDto<LocationCreateResponseDto> = await service.findAll({
        active: true,
        page: 1,
        pageSize: 50,
      });

      expect(result.items).toHaveLength(1);
    });

    it('should apply search filter', async () => {
      const locations: Location[] = [
        mockLocation({name: 'Alpha', displayName: 'Alpha Branch'}),
        mockLocation({id: 'locations/Beta', name: 'Beta', displayName: 'Beta Branch'}),
      ];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});

      const result: PagedResponseDto<LocationCreateResponseDto> = await service.findAll({
        searchTerm: 'alpha',
        page: 1,
        pageSize: 50,
      });

      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a location by ID', async () => {
      const loc: Location = mockLocation();
      session.load.mockResolvedValue(loc);

      const result: LocationCreateResponseDto = await service.findOne('Loc-1');

      expect(session.load).toHaveBeenCalledWith('locations/Loc-1');
      expect(result.name).toBe('Loc-1');
    });

    it('should throw NotFoundException when not found', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId: string = 'user-123';

    it('should update a location successfully', async () => {
      const loc: Location = mockLocation();
      session.load.mockResolvedValue(loc);

      const dto: LocationUpdateDto = {displayName: 'Updated Name'};
      const result: LocationUpdateResponseDto = await service.update('Loc-1', dto, userId);

      expect(loc.displayName).toBe('Updated Name');
      expect(session.saveChanges).toHaveBeenCalled();
      expect(result.displayName).toBe('Updated Name');
    });

    it('should throw NotFoundException when not found', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.update('missing', {}, userId)).rejects.toThrow(NotFoundException);
    });

    it('should bubble raw error on save failure', async () => {
      session.load.mockResolvedValue(mockLocation());
      session.saveChanges.mockRejectedValue(new Error('Save failed'));

      await expect(service.update('Loc-1', {displayName: 'X'}, userId)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('remove', () => {
    const userId: string = 'user-123';

    it('should deactivate a location', async () => {
      const loc: Location = mockLocation();
      session.load.mockResolvedValue(loc);

      const result: LocationUpdateResponseDto = await service.remove('Loc-1', userId);

      expect(loc.active).toBe(false);
      expect(session.saveChanges).toHaveBeenCalled();
      expect(result.active).toBe(false);
    });

    it('should throw NotFoundException when not found', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.remove('missing', userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true when location exists', async () => {
      session.load.mockResolvedValue(mockLocation());

      expect(await service.exists('locations/Loc-1')).toBe(true);
    });

    it('should return false when location does not exist', async () => {
      session.load.mockResolvedValue(null);

      expect(await service.exists('locations/missing')).toBe(false);
    });
  });

  describe('findAllActive', () => {
    it('should return all active locations sorted by name', async () => {
      const locations: Location[] = [
        mockLocation({name: 'Beta', active: true}),
        mockLocation({id: 'locations/Alpha', name: 'Alpha', active: true}),
        mockLocation({id: 'locations/Inactive', name: 'Inactive', active: false}),
      ];
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(locations)});

      const result: Location[] = await service.findAllActive();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alpha');
    });
  });
});
