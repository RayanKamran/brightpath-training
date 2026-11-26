import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {vi} from 'vitest';
import {ProblemDetailsFilter} from '../problem-details.filter';

type RequestMock = {
  originalUrl?: string;
  url: string;
  method: string;
  requestId?: string;
  correlationId?: string;
};

type ResponseMock = {
  status: ReturnType<typeof vi.fn>;
  type: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function mockCreateResponse(): ResponseMock {
  return {
    status: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

function createArgumentsHost(request: RequestMock, response: ResponseMock): ArgumentsHost {
  return {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
      getResponse: vi.fn().mockReturnValue(response),
      getNext: vi.fn(),
    }),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn(),
    getArgs: vi.fn(),
    getArgByIndex: vi.fn(),
  };
}

describe('ProblemDetailsFilter', () => {
  let filter: ProblemDetailsFilter;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    filter = new ProblemDetailsFilter();
    loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    let requestMock: RequestMock;
    let responseMock: ResponseMock;
    let argumentsHostMock: ArgumentsHost;

    beforeEach(() => {
      requestMock = {
        originalUrl: '/api/test',
        url: '/api/test',
        method: 'GET',
        requestId: 'req-123',
        correlationId: 'corr-123',
      };

      responseMock = mockCreateResponse();
      argumentsHostMock = createArgumentsHost(requestMock, responseMock);
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(404);
      expect(responseMock.type).toHaveBeenCalledWith('application/problem+json');
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Resource not found',
          instance: '/api/test',
          requestId: 'req-123',
          correlationId: 'corr-123',
        }),
      );
    });

    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(400);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:validation',
          title: 'Bad Request',
          status: 400,
          detail: 'Invalid input',
        }),
      );
    });

    it('should handle UnauthorizedException', () => {
      const exception = new UnauthorizedException('Invalid token');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(401);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid token',
        }),
      );
    });

    it('should handle ForbiddenException', () => {
      const exception = new ForbiddenException('Access denied');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(403);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Access denied',
        }),
      );
    });

    it('should handle ConflictException', () => {
      const exception = new ConflictException('Resource already exists');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(409);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:conflict',
          title: 'Conflict',
          status: 409,
          detail: 'Resource already exists',
        }),
      );
    });

    it('should handle InternalServerErrorException and log error', () => {
      const exception = new InternalServerErrorException('Server error');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(500);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:internal',
          title: 'Internal Server Error',
          status: 500,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'handled_exception',
        expect.objectContaining({
          requestId: 'req-123',
          correlationId: 'corr-123',
          status: 500,
          error: expect.objectContaining({
            message: 'Server error',
          }),
        }),
      );
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(500);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urn:dms:error:internal',
          status: 500,
          detail: 'An unexpected error occurred',
        }),
      );
    });

    it('should handle exception with array of messages', () => {
      const exception = new BadRequestException({
        message: ['Field 1 is required', 'Field 2 is invalid'],
        error: 'Bad Request',
      });

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Field 1 is required; Field 2 is invalid',
        }),
      );
    });

    describe('errors[] field (structured validation errors)', () => {
      it('produces no errors[] when BadRequestException has a single string message', () => {
        const exception = new BadRequestException('Invalid input');

        filter.catch(exception, argumentsHostMock);

        const body = (responseMock.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(body.errors).toBeUndefined();
      });

      it('produces errors[] when BadRequestException has an array of messages', () => {
        const exception = new BadRequestException({
          message: ['firstName must be a string', 'email should not be empty'],
          error: 'Bad Request',
        });

        filter.catch(exception, argumentsHostMock);

        const body = (responseMock.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(body.errors).toEqual([
          {field: 'firstName', message: 'must be a string'},
          {field: 'email', message: 'should not be empty'},
        ]);
      });

      it('produces no errors[] for non-validation HttpExceptions', () => {
        const exception = new NotFoundException('Part not found');

        filter.catch(exception, argumentsHostMock);

        const body = (responseMock.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(body.errors).toBeUndefined();
      });
    });

    it('should include timestamp', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, argumentsHostMock);

      const call: Record<string, unknown> = responseMock.json.mock.calls[0][0];

      expect(call.timestamp).toBeDefined();
      expect(new Date(call.timestamp as string).toString()).not.toBe('Invalid Date');
    });

    it('should include traceId (currently duplicates requestId)', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, argumentsHostMock);

      const call: Record<string, unknown> = responseMock.json.mock.calls[0][0];

      expect(call.traceId).toBe('req-123');
    });

    it('should use url when originalUrl is not available', () => {
      requestMock = {
        url: '/api/fallback',
        method: 'POST',
        requestId: 'req-456',
        correlationId: 'corr-456',
      };

      const newHost: ArgumentsHost = createArgumentsHost(requestMock, responseMock);

      const exception = new NotFoundException('Not found');

      filter.catch(exception, newHost);

      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          instance: '/api/fallback',
        }),
      );
    });

    it('should log handled exceptions below 500 status', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, argumentsHostMock);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'handled_exception',
        expect.objectContaining({
          status: 400,
        }),
      );
    });

    it('should log nested error cause from HttpException', () => {
      const causeError = new Error('Underlying database error');

      const exception = new ConflictException('Part "BRAKE-PAD-D1092_9" already exists', {
        cause: causeError,
      });

      filter.catch(exception, argumentsHostMock);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'handled_exception',
        expect.objectContaining({
          status: 409,
          error: expect.objectContaining({
            message: 'Part "BRAKE-PAD-D1092_9" already exists',
            cause: expect.objectContaining({
              message: 'Underlying database error',
            }),
          }),
        }),
      );
    });

    it('should handle unknown exception types', () => {
      const exception: string = 'string error';

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.status).toHaveBeenCalledWith(500);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'An unexpected error occurred',
        }),
      );
    });

    it('should set correct content type header', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, argumentsHostMock);

      expect(responseMock.type).toHaveBeenCalledWith('application/problem+json');
    });
  });
});
