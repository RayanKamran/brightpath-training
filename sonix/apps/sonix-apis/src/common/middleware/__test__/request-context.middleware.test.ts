import type {NextFunction, Response} from 'express';
import {vi} from 'vitest';
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  REQUEST_START_TIME_KEY,
  RequestContextMiddleware,
  type RequestWithContext,
} from '../request-context.middleware';

type HeaderGetter = ReturnType<typeof vi.fn<(headerName: string) => string | undefined>>;

type RequestMock = Pick<RequestWithContext, 'requestId' | 'correlationId'> & {
  header: HeaderGetter;
  [REQUEST_START_TIME_KEY]?: number;
};

type ResponseMock = {
  setHeader: ReturnType<typeof vi.fn<(headerName: string, value: string) => void>>;
};

function mockCreateRequest(): RequestMock {
  return {
    header: vi.fn(),
    requestId: '',
    correlationId: '',
  };
}

function mockCreateResponse(): ResponseMock {
  return {
    setHeader: vi.fn(),
  };
}

function asRequestWithContext(request: RequestMock): RequestWithContext {
  return request as unknown as RequestWithContext;
}

function asResponse(response: ResponseMock): Response {
  return response as unknown as Response;
}

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let requestMock: RequestMock;
  let responseMock: ResponseMock;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
    requestMock = mockCreateRequest();
    responseMock = mockCreateResponse();
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should generate requestId when not provided', () => {
      requestMock.header.mockReturnValue(undefined);

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).toBeDefined();
      expect(requestMock.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should use provided requestId when valid', () => {
      const validRequestId: string = '550e8400-e29b-41d4-a716-446655440000';
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === REQUEST_ID_HEADER) {
          return validRequestId;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).toBe(validRequestId);
    });

    it('should reject invalid requestId format', () => {
      const invalidRequestId: string = 'invalid-uuid-format';
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === REQUEST_ID_HEADER) {
          return invalidRequestId;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).not.toBe(invalidRequestId);
      expect(requestMock.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should use provided correlationId when valid', () => {
      const validCorrelationId: string = '660e8400-e29b-41d4-a716-446655440000';
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === CORRELATION_ID_HEADER) {
          return validCorrelationId;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.correlationId).toBe(validCorrelationId);
    });

    it('should default correlationId to requestId when not provided', () => {
      requestMock.header.mockReturnValue(undefined);

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.correlationId).toBe(requestMock.requestId);
    });

    it('should set start time', () => {
      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock[REQUEST_START_TIME_KEY]).toBeDefined();
      expect(typeof requestMock[REQUEST_START_TIME_KEY]).toBe('number');
      expect(requestMock[REQUEST_START_TIME_KEY]).toBeLessThanOrEqual(Date.now());
    });

    it('should set response headers', () => {
      requestMock.header.mockReturnValue(undefined);

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(responseMock.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, requestMock.requestId);
      expect(responseMock.setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        requestMock.correlationId,
      );
    });

    it('should call next middleware', () => {
      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase UUID in requestId', () => {
      const upperCaseUuid: string = '550E8400-E29B-41D4-A716-446655440000';
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === REQUEST_ID_HEADER) {
          return upperCaseUuid;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).toBeDefined();
    });

    it('should reject malformed UUID with extra characters', () => {
      const malformedUuid: string = '550e8400-e29b-41d4-a716-446655440000-extra';
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === REQUEST_ID_HEADER) {
          return malformedUuid;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).not.toBe(malformedUuid);
    });

    it('should reject oversized input to prevent injection', () => {
      const oversizedInput: string = 'a'.repeat(1000);
      requestMock.header.mockImplementation((headerName) => {
        if (headerName === REQUEST_ID_HEADER) {
          return oversizedInput;
        }
        return undefined;
      });

      middleware.use(asRequestWithContext(requestMock), asResponse(responseMock), mockNext);

      expect(requestMock.requestId).not.toBe(oversizedInput);
    });
  });
});
