import type {RegisterUserDto, RegisterUserResponse} from '@dms/data-models';
import {BadRequestException, ConflictException, Logger, NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import {LogtoManagementClient} from '../logto-management.client';
import {UserService} from '../user.service';

type LogtoCreateUserResponse = Awaited<ReturnType<LogtoManagementClient['createUser']>>;

// Suppress error logs during tests
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

function createMockSession() {
  const session = {
    load: vi.fn(),
    store: vi.fn(),
    saveChanges: vi.fn(),
    dispose: vi.fn(),
    query: vi.fn().mockReturnValue({all: vi.fn().mockResolvedValue([])}),
    [Symbol.dispose]() {
      (this as {dispose: () => void}).dispose();
    },
  };
  return session;
}

function createMockSessionFactory(session: ReturnType<typeof createMockSession>) {
  return {openSession: vi.fn().mockReturnValue(session)} as unknown as RavenSessionFactory;
}

const mockLogtoCreateUserResponse = (
  overrides: Partial<LogtoCreateUserResponse> = {},
): LogtoCreateUserResponse => ({
  id: 'logto-user-id-123',
  username: 'johndoe',
  primaryEmail: 'test@example.com',
  primaryPhone: null,
  name: 'John Doe',
  avatar: null,
  createdAt: Date.now(),
  lastSignInAt: null,
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let session: ReturnType<typeof createMockSession>;
  let logtoClientMock: {createUser: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    session = createMockSession();
    logtoClientMock = {createUser: vi.fn()};
    service = new UserService(
      logtoClientMock as unknown as LogtoManagementClient,
      createMockSessionFactory(session),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const validRegisterDto: RegisterUserDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
    };

    beforeEach(() => {
      session.load.mockResolvedValue(null); // No existing profile
      session.saveChanges.mockResolvedValue(undefined);
    });

    it('should successfully register a new user', async () => {
      logtoClientMock.createUser.mockResolvedValue(mockLogtoCreateUserResponse());

      const result: RegisterUserResponse = await service.registerUser(validRegisterDto);

      expect(result).toEqual({
        userId: 'logto-user-id-123',
        email: 'test@example.com',
        message: 'User registered successfully',
      });
      expect(logtoClientMock.createUser).toHaveBeenCalledWith({
        primaryEmail: 'test@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        username: 'johndoe',
      });
      expect(session.store).toHaveBeenCalled();
      expect(session.saveChanges).toHaveBeenCalled();
    });

    it('should register user without optional username', async () => {
      const dtoWithoutUsername: RegisterUserDto = {
        email: 'jane@example.com',
        password: 'AnotherPass456!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      logtoClientMock.createUser.mockResolvedValue(
        mockLogtoCreateUserResponse({
          id: 'logto-user-id-456',
          username: null,
          primaryEmail: 'jane@example.com',
          name: 'Jane Smith',
        }),
      );

      const result: RegisterUserResponse = await service.registerUser(dtoWithoutUsername);

      expect(result.userId).toBe('logto-user-id-456');
      expect(logtoClientMock.createUser).toHaveBeenCalledWith(
        expect.objectContaining({username: undefined}),
      );
    });

    it('should throw BadRequestException when email is missing', async () => {
      const invalidDto: RegisterUserDto = {
        email: '',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.registerUser(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.registerUser(invalidDto)).rejects.toThrow(
        'Email and password are required',
      );
      expect(logtoClientMock.createUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when password is missing', async () => {
      const invalidDto: RegisterUserDto = {
        email: 'test@example.com',
        password: '',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.registerUser(invalidDto)).rejects.toThrow(BadRequestException);
      expect(logtoClientMock.createUser).not.toHaveBeenCalled();
    });

    it('should bubble raw error when email already exists in Logto', async () => {
      logtoClientMock.createUser.mockRejectedValue(new Error('User with email already exists'));

      await expect(service.registerUser(validRegisterDto)).rejects.toThrow(
        'User with email already exists',
      );
    });

    it('should rethrow ConflictException from Logto client', async () => {
      logtoClientMock.createUser.mockRejectedValue(new ConflictException('Username already taken'));

      await expect(service.registerUser(validRegisterDto)).rejects.toThrow(ConflictException);
    });

    it('should correctly format full name from firstName and lastName', async () => {
      const dto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Mary',
        lastName: 'Johnson',
      };
      logtoClientMock.createUser.mockResolvedValue(
        mockLogtoCreateUserResponse({name: 'Mary Johnson'}),
      );

      await service.registerUser(dto);

      expect(logtoClientMock.createUser).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Mary Johnson'}),
      );
    });

    it('should throw NotFoundException when user profile not found for update', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.updateUserProfile('nonexistent', {displayName: 'Test'})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
