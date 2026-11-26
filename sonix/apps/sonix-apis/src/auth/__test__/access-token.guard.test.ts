import {ExecutionContext, ForbiddenException, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {Test, TestingModule} from '@nestjs/testing';
import {vi} from 'vitest';
import {AccessTokenGuard} from '../access-token.guard';
import {AuthInfo, extractBearerTokenFromHeaders} from '../auth-utils';
import {createAuthInfo, validateJwt} from '../jwt-validator';

type AuthPayloadMock = {
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
};

type RequestMock = {
  headers: Record<string, string | string[] | undefined>;
  auth?: AuthInfo;
};

type ReflectorMock = {
  getAllAndOverride: ReturnType<typeof vi.fn>;
};

function createExecutionContext(request: RequestMock): ExecutionContext {
  return {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
      getResponse: vi.fn(),
      getNext: vi.fn(),
    }),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn(),
    getClass: vi.fn(),
    getHandler: vi.fn(),
    getArgs: vi.fn(),
    getArgByIndex: vi.fn(),
  };
}

vi.mock('../jwt-validator', () => ({
  validateJwt: vi.fn(),
  createAuthInfo: vi.fn(),
}));

vi.mock('../auth-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth-utils')>();
  return {
    ...actual,
    extractBearerTokenFromHeaders: vi.fn(),
  };
});

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let executionContextMock: ExecutionContext;
  let requestMock: RequestMock;

  const reflectorMock: ReflectorMock = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    beforeEach(() => {
      requestMock = {headers: {}};
      executionContextMock = createExecutionContext(requestMock);
    });

    it('should allow access to public routes', async () => {
      reflectorMock.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(executionContextMock);

      expect(result).toBe(true);
    });

    it('should validate token and allow access', async () => {
      const mockPayload: AuthPayloadMock = {
        sub: 'user-123',
        aud: 'api',
        exp: 123,
        iat: 123,
        iss: 'issuer',
      };
      const mockAuthInfo = new AuthInfo('user-123', 'client-id', 'org-id', [], ['api'], []);

      reflectorMock.getAllAndOverride.mockReturnValue(false);
      (extractBearerTokenFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue('valid-token');
      (validateJwt as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayload);
      (createAuthInfo as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthInfo);

      const result = await guard.canActivate(executionContextMock);

      expect(result).toBe(true);
      expect(requestMock).toHaveProperty('auth');
      expect(requestMock.auth).toEqual(mockAuthInfo);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      reflectorMock.getAllAndOverride.mockReturnValue(false);
      (extractBearerTokenFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue('invalid-token');
      (validateJwt as ReturnType<typeof vi.fn>).mockRejectedValue({
        status: 401,
        message: 'Invalid token',
      });

      await expect(guard.canActivate(executionContextMock)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for forbidden error', async () => {
      reflectorMock.getAllAndOverride.mockReturnValue(false);
      (extractBearerTokenFromHeaders as ReturnType<typeof vi.fn>).mockReturnValue('token');
      (validateJwt as ReturnType<typeof vi.fn>).mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      });

      await expect(guard.canActivate(executionContextMock)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for missing token', async () => {
      reflectorMock.getAllAndOverride.mockReturnValue(false);
      (extractBearerTokenFromHeaders as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Missing token');
      });

      await expect(guard.canActivate(executionContextMock)).rejects.toThrow(UnauthorizedException);
    });
  });
});
