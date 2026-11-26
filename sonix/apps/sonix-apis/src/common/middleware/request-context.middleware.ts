import {randomUUID} from 'node:crypto';
import {Injectable, NestMiddleware} from '@nestjs/common';
import type {NextFunction, Request, Response} from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_START_TIME_KEY = '__idsRequestStartMs';

/**
 * Validates that a header value is a well-formed UUID (v4 hex format).
 * Rejects oversized, malformed, or malicious values to prevent log injection.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeIdHeader(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return UUID_PATTERN.test(value) ? value : undefined;
}

export type RequestWithContext = Request & {
  requestId?: string;
  correlationId?: string;
  auth?: {
    sub?: string;
    roles?: string[];
    organizationId?: string;
  };
  [REQUEST_START_TIME_KEY]?: number;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  public use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const requestId = sanitizeIdHeader(req.header(REQUEST_ID_HEADER)) || randomUUID();
    // When no correlation ID is provided, default to requestId.
    // This is correct — correlation ID groups related requests in a multi-call operation.
    // For single requests there is nothing to correlate, so requestId is the natural default.
    const correlationId = sanitizeIdHeader(req.header(CORRELATION_ID_HEADER)) || requestId;

    req.requestId = requestId;
    req.correlationId = correlationId;
    req[REQUEST_START_TIME_KEY] = Date.now();

    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
