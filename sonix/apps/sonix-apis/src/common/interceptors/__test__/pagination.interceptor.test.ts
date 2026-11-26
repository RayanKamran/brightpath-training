import {BadRequestException, CallHandler, ExecutionContext} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {PaginationInterceptor} from '../pagination.interceptor';

type PaginationQuery = {
  limit?: string | number;
  pageSize?: string | number;
  take?: string | number;
};

type RequestLike = {
  query: PaginationQuery;
};

function createExecutionContext(request: RequestLike): ExecutionContext {
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

describe('PaginationInterceptor', () => {
  let interceptor: PaginationInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationInterceptor],
    }).compile();

    interceptor = module.get<PaginationInterceptor>(PaginationInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    const mockCallHandler: CallHandler = {
      handle: vi.fn().mockReturnValue(of('test')),
    };

    it('should set default limit when not provided', () => {
      const requestMock: RequestLike = {query: {}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.limit).toBe(100);
    });

    it('should accept valid limit', () => {
      const requestMock: RequestLike = {query: {limit: '50'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.limit).toBe(50);
    });

    it('should throw BadRequestException for limit exceeding maximum', () => {
      const requestMock: RequestLike = {query: {limit: '5000'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        'Query limit cannot exceed 3000 records',
      );
    });

    it('should throw BadRequestException for negative limit', () => {
      const requestMock: RequestLike = {query: {limit: '-10'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        'Query limit must be a positive number',
      );
    });

    it('should throw BadRequestException for zero limit', () => {
      const requestMock: RequestLike = {query: {limit: '0'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-numeric limit', () => {
      const requestMock: RequestLike = {query: {limit: 'invalid'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
    });

    it('should validate pageSize parameter', () => {
      const requestMock: RequestLike = {query: {pageSize: '100'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.pageSize).toBe(100);
    });

    it('should throw BadRequestException for pageSize exceeding maximum', () => {
      const requestMock: RequestLike = {query: {pageSize: '4000'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        'Page size cannot exceed 3000 records',
      );
    });

    it('should validate take parameter', () => {
      const requestMock: RequestLike = {query: {take: '200'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.take).toBe(200);
    });

    it('should throw BadRequestException for take exceeding maximum', () => {
      const requestMock: RequestLike = {query: {take: '3500'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        BadRequestException,
      );
      expect(() => interceptor.intercept(executionContextMock, mockCallHandler)).toThrow(
        'Take parameter cannot exceed 3000 records',
      );
    });

    it('should handle multiple pagination parameters', () => {
      const requestMock: RequestLike = {query: {limit: '50', pageSize: '100', take: '75'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.limit).toBe(50);
      expect(requestMock.query.pageSize).toBe(100);
      expect(requestMock.query.take).toBe(75);
    });

    it('should accept limit at maximum boundary', () => {
      const requestMock: RequestLike = {query: {limit: '3000'}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(requestMock.query.limit).toBe(3000);
    });

    it('should call next handler', () => {
      const requestMock: RequestLike = {query: {}};
      const executionContextMock: ExecutionContext = createExecutionContext(requestMock);

      interceptor.intercept(executionContextMock, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });
  });
});
