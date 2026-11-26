import type {ProblemDetailDto, ProblemFieldError, ProblemUrnType} from '@dms/data-models';
import {PROBLEM_URN_TYPE} from '@dms/data-models';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import type {Request, Response} from 'express';
import {LocationsCacheService} from '../../location/locations-cache.service';
import type {RequestWithContext} from '../middleware/request-context.middleware';

const STATUS_TO_URN: Record<number, ProblemUrnType> = {
  [HttpStatus.BAD_REQUEST]: PROBLEM_URN_TYPE.VALIDATION,
  [HttpStatus.UNAUTHORIZED]: PROBLEM_URN_TYPE.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: PROBLEM_URN_TYPE.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: PROBLEM_URN_TYPE.NOT_FOUND,
  [HttpStatus.CONFLICT]: PROBLEM_URN_TYPE.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: PROBLEM_URN_TYPE.TOO_MANY_REQUESTS,
  [HttpStatus.INTERNAL_SERVER_ERROR]: PROBLEM_URN_TYPE.INTERNAL,
  [HttpStatus.SERVICE_UNAVAILABLE]: PROBLEM_URN_TYPE.SERVICE_UNAVAILABLE,
};

function parseValidationMessage(message: string): ProblemFieldError {
  const match = message.match(/^(\w+)\s+(.+)$/);
  if (match) {
    return {field: match[1], message: match[2]};
  }
  return {field: '_form', message};
}

@Injectable()
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly _logger = new Logger(ProblemDetailsFilter.name);

  constructor(@Optional() private readonly _locationsCache?: LocationsCacheService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const req = httpContext.getRequest<RequestWithContext & Request>();
    const res = httpContext.getResponse<Response>();

    const status: number = this.resolveStatus(exception);
    const problem: ProblemDetailDto = this.buildProblemDetails(exception, req, status);

    this._logger.error('handled_exception', {
      type: problem.type,
      location: problem.location,
      userId: problem.userId,
      instance: problem.instance,
      traceId: problem.traceId,
      timestamp: problem.timestamp,
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl || req.url,
      status,
      error: this.serializeLogError(exception),
    });

    res.status(status).type('application/problem+json').json(problem);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildProblemDetails(
    exception: unknown,
    req: RequestWithContext & Request,
    status: number,
  ): ProblemDetailDto {
    let detail: string | undefined;
    let title = HttpStatus[status] ?? 'Error';
    let errors: ProblemFieldError[] | undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        detail = response;
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as {message?: string | string[]; error?: string};
        if (Array.isArray(responseObj.message)) {
          detail = responseObj.message.join('; ');
          if (exception instanceof BadRequestException) {
            errors = responseObj.message.map(parseValidationMessage);
          }
        } else {
          detail = responseObj.message || responseObj.error;
        }
        if (responseObj.error) {
          title = responseObj.error;
        }
      }
    } else {
      detail = 'An unexpected error occurred';
    }

    const location = this.resolveLocation(req);
    const userId = req.auth?.sub ?? null;

    return {
      type: this.toUrnType(status),
      title,
      status,
      detail,
      errors,
      instance: req.originalUrl || req.url,
      location,
      userId,
      requestId: req.requestId,
      correlationId: req.correlationId,
      traceId: req.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  private toUrnType(status: number): ProblemUrnType {
    return STATUS_TO_URN[status] ?? PROBLEM_URN_TYPE.INTERNAL;
  }

  private resolveLocation(req: RequestWithContext & Request): string | null {
    const organizationId = req.auth?.organizationId;
    const requestLocationId = (req.body as {locationId?: string} | undefined)?.locationId;

    const locationFromOrg = organizationId
      ? (this._locationsCache?.getByLogtoId(organizationId)?.name ?? null)
      : null;

    if (locationFromOrg) {
      return locationFromOrg;
    }

    return requestLocationId
      ? (this._locationsCache?.getById(requestLocationId)?.name ?? null)
      : null;
  }

  private serializeLogError(exception: unknown, depth = 0): unknown {
    if (depth > 2) {
      return 'max_error_cause_depth_reached';
    }

    if (exception instanceof Error) {
      const withCause = exception as Error & {cause?: unknown};
      const serialized: Record<string, unknown> = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack || exception.message,
      };

      if (withCause.cause !== undefined) {
        serialized.cause = this.serializeLogError(withCause.cause, depth + 1);
      }

      return serialized;
    }

    if (typeof exception === 'object' && exception !== null) {
      const obj = exception as Record<string, unknown>;
      const output: Record<string, unknown> = {};
      const fields = ['name', 'message', 'code', 'detail'];

      for (const field of fields) {
        if (obj[field] !== undefined) {
          output[field] = obj[field];
        }
      }

      if (Object.keys(output).length > 0) {
        return output;
      }
    }

    return exception;
  }
}
