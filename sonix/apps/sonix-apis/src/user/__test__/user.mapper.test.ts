import type {User as IUser} from '@dms/data-models';
import {describe, expect, it} from 'vitest';
import {UserResponseDto} from '../dto/user-response.dto';
import {toUserDto, toUserDtoList} from '../user.mapper';

describe('UserMapper', () => {
  describe('toUserDto', () => {
    it('should map user with all fields', () => {
      const user: IUser = {
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: 'testuser',
        nickname: 'Tester',
        displayName: 'Test User',
        bio: 'Test bio',
        preferredLanguage: 'en',
        timezone: 'America/New_York',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        profileCompleteness: 85,
        lastLoginAt: new Date('2024-01-15'),
        createdBy: 'system',
        updatedBy: 'system',
        createdDate: new Date(),
        updatedDate: new Date(),
        version: 1,
        isDeleted: false,
      };

      const result: UserResponseDto = toUserDto(user);

      expect(result).toEqual({
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: 'testuser',
        nickname: 'Tester',
        displayName: 'Test User',
        bio: 'Test bio',
        preferredLanguage: 'en',
        timezone: 'America/New_York',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        profileCompleteness: 85,
        lastLoginAt: user.lastLoginAt,
        hasProfilePhoto: false,
      });
    });

    it('should handle null values with StringNormalizer', () => {
      const user: IUser = {
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: null,
        nickname: '  ',
        displayName: null,
        bio: null,
        preferredLanguage: null,
        timezone: null,
        emailNotifications: false,
        smsNotifications: false,
        marketingEmails: false,
        profileCompleteness: 25,
        lastLoginAt: null,
        createdBy: 'system',
        updatedBy: 'system',
        createdDate: new Date(),
        updatedDate: new Date(),
        version: 1,
        isDeleted: false,
      };

      const result: UserResponseDto = toUserDto(user);

      expect(result.username).toBeNull();
      expect(result.nickname).toBeNull();
      expect(result.displayName).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.preferredLanguage).toBeNull();
      expect(result.timezone).toBeNull();
      expect(result.lastLoginAt).toBeNull();
    });

    it('should trim whitespace in string fields', () => {
      const user: IUser = {
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: '  testuser  ',
        nickname: '  Tester  ',
        displayName: '  Test User  ',
        bio: '  Bio text  ',
        preferredLanguage: '  en  ',
        timezone: '  UTC  ',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        profileCompleteness: 50,
        lastLoginAt: null,
        createdBy: 'system',
        updatedBy: 'system',
        createdDate: new Date(),
        updatedDate: new Date(),
        version: 1,
        isDeleted: false,
      };

      const result: UserResponseDto = toUserDto(user);

      expect(result.username).toBe('testuser');
      expect(result.nickname).toBe('Tester');
      expect(result.displayName).toBe('Test User');
      expect(result.bio).toBe('Bio text');
      expect(result.preferredLanguage).toBe('en');
      expect(result.timezone).toBe('UTC');
    });

    it('should preserve boolean notification preferences', () => {
      const user: IUser = {
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: null,
        nickname: null,
        displayName: null,
        bio: null,
        preferredLanguage: null,
        timezone: null,
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        profileCompleteness: 50,
        lastLoginAt: null,
        createdBy: 'system',
        updatedBy: 'system',
        createdDate: new Date(),
        updatedDate: new Date(),
        version: 1,
        isDeleted: false,
      };

      const result: UserResponseDto = toUserDto(user);

      expect(result.emailNotifications).toBe(true);
      expect(result.smsNotifications).toBe(true);
      expect(result.marketingEmails).toBe(false);
    });

    it('should handle undefined lastLoginAt as null', () => {
      const userWithUndefined: IUser = {
        id: 'user-1',
        logtoUserId: 'logto-123',
        email: 'test@example.com',
        username: null,
        nickname: null,
        displayName: null,
        bio: null,
        preferredLanguage: null,
        timezone: null,
        emailNotifications: false,
        smsNotifications: false,
        marketingEmails: false,
        profileCompleteness: 0,
        lastLoginAt: null,
        createdBy: 'system',
        updatedBy: 'system',
        createdDate: new Date(),
        updatedDate: new Date(),
        version: 1,
        isDeleted: false,
      };

      const result: UserResponseDto = toUserDto(userWithUndefined);
      expect(result.lastLoginAt).toBeNull();
    });
  });

  describe('toUserDtoList', () => {
    it('should map array of users', () => {
      const users: IUser[] = [
        {
          id: 'user-1',
          logtoUserId: 'logto-1',
          email: 'user1@example.com',
          username: 'user1',
          nickname: null,
          displayName: 'User One',
          bio: null,
          preferredLanguage: null,
          timezone: null,
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          profileCompleteness: 50,
          lastLoginAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
          createdDate: new Date(),
          updatedDate: new Date(),
          version: 1,
          isDeleted: false,
        },
        {
          id: 'user-2',
          logtoUserId: 'logto-2',
          email: 'user2@example.com',
          username: 'user2',
          nickname: null,
          displayName: 'User Two',
          bio: null,
          preferredLanguage: null,
          timezone: null,
          emailNotifications: false,
          smsNotifications: false,
          marketingEmails: true,
          profileCompleteness: 75,
          lastLoginAt: null,
          createdBy: 'system',
          updatedBy: 'system',
          createdDate: new Date(),
          updatedDate: new Date(),
          version: 1,
          isDeleted: false,
        },
      ];

      const result: UserResponseDto[] = toUserDtoList(users);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[0].username).toBe('user1');
      expect(result[1].id).toBe('user-2');
      expect(result[1].username).toBe('user2');
    });

    it('should handle empty array', () => {
      const result: UserResponseDto[] = toUserDtoList([]);
      expect(result).toEqual([]);
    });
  });
});
