import {describe, expect, it} from 'vitest';
import type {LocationUserDto} from '../dto/location.dto';
import type {LocationCreateResponseDto} from '../dto/location-create.dto';
import type {LocationListResponseDto} from '../dto/location-list.query.dto';
import type {Location as DbLocation} from '../entities/location.entity';
import {
  toLocationCreateResponseDto,
  toLocationCreateResponseDtoList,
  toLocationListResponseDto,
  toLocationListResponseDtoList,
} from '../location.mapper';

describe('LocationMapper', () => {
  describe('toLocationCreateResponseDto', () => {
    it('should map location with all fields', () => {
      const dbLocation: DbLocation = {
        id: 'loc-1',
        name: 'Main Location',
        displayName: 'Main Display',
        logtoId: 'logto-123',
        description: 'Test location',
        active: true,
        defaultCurrency: 'USD' as const,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdDate: new Date(),
        updatedDate: new Date(),
        isDeleted: false,
        version: 1,
      };

      const result: LocationCreateResponseDto = toLocationCreateResponseDto(dbLocation);

      expect(result).toEqual({
        id: 'loc-1',
        name: 'Main Location',
        displayName: 'Main Display',
        logtoId: 'logto-123',
        description: 'Test location',
        active: true,
        addresses: [],
        contacts: [],
      });
    });

    it('should handle null values with StringNormalizer', () => {
      const dbLocation: DbLocation = {
        id: 'loc-1',
        name: 'Main',
        displayName: undefined,
        logtoId: '  ',
        description: undefined,
        active: true,
        defaultCurrency: 'USD' as const,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdDate: new Date(),
        updatedDate: new Date(),
        isDeleted: false,
        version: 1,
      };

      const result: LocationCreateResponseDto = toLocationCreateResponseDto(dbLocation);

      expect(result.displayName).toBeNull();
      expect(result.logtoId).toBeNull();
      expect(result.description).toBeNull();
    });

    it('should trim whitespace in string fields', () => {
      const dbLocation: DbLocation = {
        id: 'loc-1',
        name: 'Test',
        displayName: '  Display Name  ',
        logtoId: '  logto-id  ',
        description: '  Description  ',
        active: true,
        defaultCurrency: 'USD' as const,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdDate: new Date(),
        updatedDate: new Date(),
        isDeleted: false,
        version: 1,
      };

      const result: LocationCreateResponseDto = toLocationCreateResponseDto(dbLocation);

      expect(result.displayName).toBe('Display Name');
      expect(result.logtoId).toBe('logto-id');
      expect(result.description).toBe('Description');
    });

    it('should preserve active status', () => {
      const activeLocation: DbLocation = {
        id: 'loc-1',
        name: 'Active',
        displayName: undefined,
        logtoId: undefined,
        description: undefined,
        active: true,
        defaultCurrency: 'USD' as const,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdDate: new Date(),
        updatedDate: new Date(),
        isDeleted: false,
        version: 1,
      };

      const inactiveLocation: DbLocation = {...activeLocation, id: 'loc-2', active: false};

      expect(toLocationCreateResponseDto(activeLocation).active).toBe(true);
      expect(toLocationCreateResponseDto(inactiveLocation).active).toBe(false);
    });
  });

  describe('toLocationCreateResponseDtoList', () => {
    it('should map array of locations', () => {
      const locations: DbLocation[] = [
        {
          id: 'loc-1',
          name: 'Location 1',
          displayName: 'Display 1',
          logtoId: 'logto-1',
          description: 'Desc 1',
          active: true,
          defaultCurrency: 'USD' as const,
          createdBy: 'user-1',
          updatedBy: 'user-1',
          createdDate: new Date(),
          updatedDate: new Date(),
          isDeleted: false,
          version: 1,
        },
        {
          id: 'loc-2',
          name: 'Location 2',
          displayName: 'Display 2',
          logtoId: 'logto-2',
          description: 'Desc 2',
          active: false,
          defaultCurrency: 'USD' as const,
          createdBy: 'user-1',
          updatedBy: 'user-1',
          createdDate: new Date(),
          updatedDate: new Date(),
          isDeleted: false,
          version: 1,
        },
      ];

      const result: LocationCreateResponseDto[] = toLocationCreateResponseDtoList(locations);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('loc-1');
      expect(result[0].name).toBe('Location 1');
      expect(result[1].id).toBe('loc-2');
      expect(result[1].name).toBe('Location 2');
    });

    it('should handle empty array', () => {
      const result: LocationCreateResponseDto[] = toLocationCreateResponseDtoList([]);
      expect(result).toEqual([]);
    });
  });

  describe('toLocationListResponseDto', () => {
    it('should map user location with roles', () => {
      const userLocation: LocationUserDto = {
        id: 'loc-1',
        name: 'Test Location',
        displayName: 'Display',
        logtoId: 'logto-1',
        description: 'Description',
        active: true,
        roles: [
          {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
            customData: {level: 'high'},
          },
        ],
      };

      const result: LocationListResponseDto = toLocationListResponseDto(userLocation);

      expect(result.id).toBe('loc-1');
      expect(result.roles).toHaveLength(1);
      expect(result.roles?.[0].name).toBe('Admin');
      expect(result.roles?.[0].customData).toEqual({level: 'high'});
    });

    it('should map user location without roles', () => {
      const userLocation: LocationUserDto = {
        id: 'loc-1',
        name: 'Test Location',
        displayName: 'Display',
        logtoId: 'logto-1',
        description: 'Description',
        active: true,
        roles: [],
      };

      const result: LocationListResponseDto = toLocationListResponseDto(userLocation);

      expect(result.id).toBe('loc-1');
      expect(result.roles).toEqual([]);
    });

    it('should handle undefined roles', () => {
      const userLocation: DbLocation = {
        id: 'loc-1',
        name: 'Test Location',
        displayName: 'Display',
        logtoId: 'logto-1',
        description: 'Description',
        active: true,
        createdDate: new Date(),
        updatedDate: new Date(),
        createdBy: undefined,
        updatedBy: undefined,
        version: 1,
        isDeleted: false,
        defaultCurrency: 'USD',
      };

      const result: LocationListResponseDto = toLocationListResponseDto(
        userLocation as LocationUserDto,
      );

      expect(result.id).toBe('loc-1');
      expect(result.roles).toBeUndefined();
    });
  });

  describe('toLocationListResponseDtoList', () => {
    it('should map array of user locations', () => {
      const userLocations: LocationUserDto[] = [
        {
          id: 'loc-1',
          name: 'Location 1',
          displayName: 'Display 1',
          logtoId: 'logto-1',
          description: 'Desc 1',
          active: true,
          roles: [{id: 'role-1', name: 'Admin'}],
        },
        {
          id: 'loc-2',
          name: 'Location 2',
          displayName: 'Display 2',
          logtoId: 'logto-2',
          description: 'Desc 2',
          active: true,
          roles: [],
        },
      ];

      const result: LocationListResponseDto[] = toLocationListResponseDtoList(userLocations);

      expect(result).toHaveLength(2);
      expect(result[0].roles).toHaveLength(1);
      expect(result[1].roles).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const result: LocationListResponseDto[] = toLocationListResponseDtoList([]);
      expect(result).toEqual([]);
    });
  });
});
