import type {RegisterUserDto, RegisterUserResponse} from '@dms/data-models';
import {ConflictException, InternalServerErrorException} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {vi} from 'vitest';
import {LocationService} from '../../location/location.service';
import {UserController} from '../user.controller';
import {UserService} from '../user.service';

type UserServiceMock = {
  registerUser: ReturnType<typeof vi.fn>;
};

const createMockRegisterResponse = (
  overrides: Partial<RegisterUserResponse> = {},
): RegisterUserResponse => ({
  userId: 'logto-user-id-123',
  email: 'test@example.com',
  message: 'User registered successfully',
  ...overrides,
});

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const userServiceMock: UserServiceMock = {
    registerUser: vi.fn(),
  };

  const mockLocationService: {getUserLocations: ReturnType<typeof vi.fn>} = {
    getUserLocations: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const validRegisterDto: RegisterUserDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
    };

    const expectedResponse: RegisterUserResponse = createMockRegisterResponse();

    it('should successfully register a new user', async () => {
      userServiceMock.registerUser.mockResolvedValue(expectedResponse);

      const result: RegisterUserResponse = await controller.register(validRegisterDto);

      expect(result).toEqual(expectedResponse);
      expect(userService.registerUser).toHaveBeenCalledWith(validRegisterDto);
      expect(userService.registerUser).toHaveBeenCalledTimes(1);
    });

    it('should register a user without optional username', async () => {
      const dtoWithoutUsername: RegisterUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const response: RegisterUserResponse = createMockRegisterResponse({
        userId: 'logto-user-id-456',
      });

      userServiceMock.registerUser.mockResolvedValue(response);

      const result: RegisterUserResponse = await controller.register(dtoWithoutUsername);

      expect(result).toEqual(response);
      expect(userService.registerUser).toHaveBeenCalledWith(dtoWithoutUsername);
    });

    it('should throw ConflictException when email already exists', async () => {
      userServiceMock.registerUser.mockRejectedValue(
        new ConflictException('A user with this email already exists'),
      );

      await expect(controller.register(validRegisterDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(validRegisterDto)).rejects.toThrow(
        'A user with this email already exists',
      );
    });

    it('should throw InternalServerErrorException on service failure', async () => {
      userServiceMock.registerUser.mockRejectedValue(
        new InternalServerErrorException('Failed to register user. Please try again later.'),
      );

      await expect(controller.register(validRegisterDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle registration with optional phone number', async () => {
      const dtoWithPhone: RegisterUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        phoneNumber: '+1234567890',
      };

      userServiceMock.registerUser.mockResolvedValue(expectedResponse);

      const result: RegisterUserResponse = await controller.register(dtoWithPhone);

      expect(result).toEqual(expectedResponse);
      expect(userService.registerUser).toHaveBeenCalledWith(dtoWithPhone);
    });
  });
});
