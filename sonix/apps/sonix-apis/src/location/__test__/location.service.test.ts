import {ForbiddenException, Logger, NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import {LogtoManagementClient} from '../../user/logto-management.client';
import type {LocationCreateResponseDto} from '../dto/location-create.dto';
import type {LocationListResponseDto} from '../dto/location-list.query.dto';
import {Location as LocationEntity} from '../entities/location.entity';
import {LocationService} from '../location.service';

// Suppress error logs during tests (these are expected from error-handling tests)
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

type LogtoOrganization = {id: string; name: string; description?: string};
type LogtoRole = {id: string; name: string; description?: string; customData?: unknown};

function createMockSession(allLocations: LocationEntity[] = []) {
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

const mockDbLocation = (overrides: Partial<LocationEntity> = {}): LocationEntity =>
  Object.assign(new LocationEntity(), {
    id: 'db-loc-1',
    name: 'HQ',
    displayName: 'Headquarters',
    logtoId: 'org-1',
    description: 'Main office location',
    active: true,
    createdDate: new Date(),
    updatedDate: new Date(),
    version: 1,
    isDeleted: false,
    ...overrides,
  });

describe('LocationService', () => {
  let service: LocationService;
  let session: ReturnType<typeof createMockSession>;
  let mockLogtoClient: {
    getUserOrganizations: ReturnType<typeof vi.fn>;
    getUserOrganizationRoles: ReturnType<typeof vi.fn>;
    getOrganization: ReturnType<typeof vi.fn>;
  };

  const mockOrgs: LogtoOrganization[] = [
    {id: 'org-1', name: 'ACME RV Headquarters', description: 'Main office location'},
    {id: 'org-2', name: 'West Coast Branch', description: 'West coast location'},
  ];

  const mockDbLocations: LocationEntity[] = [
    mockDbLocation({
      id: 'db-loc-1',
      name: 'HQ',
      displayName: 'Headquarters',
      logtoId: 'org-1',
      description: 'Main office location',
    }),
    mockDbLocation({
      id: 'db-loc-2',
      name: 'WEST',
      displayName: 'West Coast',
      logtoId: 'org-2',
      description: 'West coast location',
    }),
  ];

  const mockRolesOrg1: LogtoRole[] = [
    {id: 'role-1', name: 'Admin', description: 'Administrator role'},
    {id: 'role-2', name: 'Manager', description: 'Manager role'},
  ];

  const mockRolesOrg2: LogtoRole[] = [
    {
      id: 'role-3',
      name: 'User',
      description: 'Standard user role',
    },
  ];

  beforeEach(() => {
    session = createMockSession(mockDbLocations);
    mockLogtoClient = {
      getUserOrganizations: vi.fn(),
      getUserOrganizationRoles: vi.fn(),
      getOrganization: vi.fn(),
    };
    const sessionFactory: RavenSessionFactory = createMockSessionFactory(session);
    service = new LocationService(
      mockLogtoClient as unknown as LogtoManagementClient,
      sessionFactory,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserLocations', () => {
    const mockUserId: string = 'test-user-123';

    it('should successfully fetch all user locations with roles', async () => {
      mockLogtoClient.getUserOrganizations.mockResolvedValue(mockOrgs);
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(mockDbLocations)});
      mockLogtoClient.getUserOrganizationRoles
        .mockResolvedValueOnce(mockRolesOrg1)
        .mockResolvedValueOnce(mockRolesOrg2);

      const result: LocationListResponseDto[] = await service.getUserLocations(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].roles).toHaveLength(2);
      expect(result[1].roles).toHaveLength(1);
      expect(mockLogtoClient.getUserOrganizations).toHaveBeenCalledWith(mockUserId);
      expect(mockLogtoClient.getUserOrganizationRoles).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when user has no organizations', async () => {
      mockLogtoClient.getUserOrganizations.mockResolvedValue([]);

      const result: LocationListResponseDto[] = await service.getUserLocations(mockUserId);

      expect(result).toEqual([]);
      expect(mockLogtoClient.getUserOrganizationRoles).not.toHaveBeenCalled();
    });

    it('should return location with empty roles if role fetch fails', async () => {
      mockLogtoClient.getUserOrganizations.mockResolvedValue([mockOrgs[0]]);
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue([mockDbLocations[0]])});
      mockLogtoClient.getUserOrganizationRoles.mockRejectedValue(new Error('Role fetch failed'));

      const result: LocationListResponseDto[] = await service.getUserLocations(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].roles).toEqual([]);
    });

    it('should handle mixed role fetch success/failure', async () => {
      mockLogtoClient.getUserOrganizations.mockResolvedValue(mockOrgs);
      session.query.mockReturnValue({all: vi.fn().mockResolvedValue(mockDbLocations)});
      mockLogtoClient.getUserOrganizationRoles
        .mockResolvedValueOnce(mockRolesOrg1)
        .mockRejectedValueOnce(new Error('Role fetch failed for org-2'));

      const result: LocationListResponseDto[] = await service.getUserLocations(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].roles).toHaveLength(2);
      expect(result[1].roles).toEqual([]);
    });

    it('should bubble raw error when getUserOrganizations fails', async () => {
      mockLogtoClient.getUserOrganizations.mockRejectedValue(new Error('Logto API error'));

      await expect(service.getUserLocations(mockUserId)).rejects.toThrow('Logto API error');
      expect(mockLogtoClient.getUserOrganizationRoles).not.toHaveBeenCalled();
    });
  });

  describe('getLocationById', () => {
    const mockUserId: string = 'test-user-123';
    const mockLocationId: string = 'db-loc-1';

    it('should return location details when user has access', async () => {
      const loc: LocationEntity = mockDbLocation();
      session.load.mockResolvedValue(loc);

      // getUserLocations call (second session open)
      const session2 = createMockSession([loc]);
      mockLogtoClient.getUserOrganizations.mockResolvedValue([mockOrgs[0]]);
      session2.query.mockReturnValue({all: vi.fn().mockResolvedValue([loc])});
      mockLogtoClient.getUserOrganizationRoles.mockResolvedValue([]);

      // The service uses openSession() multiple times; after first call returns session, use session2
      const sessionFactory: RavenSessionFactory = {
        openSession: vi.fn().mockReturnValueOnce(session).mockReturnValue(session2),
      } as unknown as RavenSessionFactory;
      service = new LocationService(
        mockLogtoClient as unknown as LogtoManagementClient,
        sessionFactory,
      );

      const result: LocationCreateResponseDto = await service.getLocationById(
        mockUserId,
        mockLocationId,
      );

      expect(result.name).toBe('HQ');
    });

    it('should throw NotFoundException when location not found in DB', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.getLocationById(mockUserId, mockLocationId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const loc: LocationEntity = mockDbLocation();
      session.load.mockResolvedValue(loc);

      // getUserLocations returns orgs that don't include this logtoId
      const session2 = createMockSession([]);
      mockLogtoClient.getUserOrganizations.mockResolvedValue([{id: 'other-org', name: 'Other'}]);
      session2.query.mockReturnValue({all: vi.fn().mockResolvedValue([])});
      mockLogtoClient.getUserOrganizationRoles.mockResolvedValue([]);
      const sessionFactory: RavenSessionFactory = {
        openSession: vi.fn().mockReturnValueOnce(session).mockReturnValue(session2),
      } as unknown as RavenSessionFactory;
      service = new LocationService(
        mockLogtoClient as unknown as LogtoManagementClient,
        sessionFactory,
      );

      await expect(service.getLocationById(mockUserId, mockLocationId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should bubble raw error when getUserLocations fails', async () => {
      const loc: LocationEntity = mockDbLocation();

      session.load.mockResolvedValue(loc);
      const session2 = createMockSession();
      mockLogtoClient.getUserOrganizations.mockRejectedValue(new Error('Logto API error'));
      const sessionFactory: RavenSessionFactory = {
        openSession: vi.fn().mockReturnValueOnce(session).mockReturnValue(session2),
      } as unknown as RavenSessionFactory;
      service = new LocationService(
        mockLogtoClient as unknown as LogtoManagementClient,
        sessionFactory,
      );

      await expect(service.getLocationById(mockUserId, mockLocationId)).rejects.toThrow(
        'Logto API error',
      );
    });

    it('should bubble raw error when database load fails', async () => {
      session.load.mockRejectedValue(new Error('Database error'));

      await expect(service.getLocationById(mockUserId, mockLocationId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
