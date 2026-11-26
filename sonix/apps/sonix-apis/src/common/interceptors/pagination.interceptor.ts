import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {Observable} from 'rxjs';

/**
 * Global pagination interceptor that enforces query limits to protect database performance.
 *
 * Features:
 * - Enforces a maximum limit of 3000 records per query
 * - Sets a default limit of 100 if none is provided
 * - Validates and sanitizes pagination parameters
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  private readonly MAX_QUERY_LIMIT = 3000;
  private readonly DEFAULT_LIMIT = 100;

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const {query} = request;

    // Check and validate limit parameter
    if (query.limit) {
      const limit = Number.parseInt(query.limit, 10);

      // Validate it's a valid positive number
      if (Number.isNaN(limit) || limit <= 0) {
        throw new BadRequestException('Query limit must be a positive number');
      }

      // Enforce maximum limit
      if (limit > this.MAX_QUERY_LIMIT) {
        throw new BadRequestException(
          `Query limit cannot exceed ${this.MAX_QUERY_LIMIT} records. Requested: ${limit}`,
        );
      }

      // Ensure limit is set as number
      query.limit = limit;
    } else {
      // Set default limit if not provided
      query.limit = this.DEFAULT_LIMIT;
    }

    // Validate pageSize parameter if present (alternative naming)
    if (query.pageSize) {
      const pageSize = Number.parseInt(query.pageSize, 10);

      if (Number.isNaN(pageSize) || pageSize <= 0) {
        throw new BadRequestException('Page size must be a positive number');
      }

      if (pageSize > this.MAX_QUERY_LIMIT) {
        throw new BadRequestException(
          `Page size cannot exceed ${this.MAX_QUERY_LIMIT} records. Requested: ${pageSize}`,
        );
      }

      query.pageSize = pageSize;
    }

    // Validate take parameter if present
    if (query.take) {
      const take = Number.parseInt(query.take, 10);

      if (Number.isNaN(take) || take <= 0) {
        throw new BadRequestException('Take parameter must be a positive number');
      }

      if (take > this.MAX_QUERY_LIMIT) {
        throw new BadRequestException(
          `Take parameter cannot exceed ${this.MAX_QUERY_LIMIT} records. Requested: ${take}`,
        );
      }

      query.take = take;
    }

    return next.handle();
  }
}
