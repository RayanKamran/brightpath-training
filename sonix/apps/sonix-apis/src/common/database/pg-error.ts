import {HttpStatus} from '@nestjs/common';

/**
 * Typed subset of the PostgreSQL wire-protocol error fields surfaced by node-postgres.
 * TypeORM spreads these onto QueryFailedError via Object.assign(this, driverError).
 * Field codes reference: https://www.postgresql.org/docs/current/protocol-error-fields.html
 */
export interface PgQueryError {
  /** SQLSTATE error code (field code 'C') — see https://www.postgresql.org/docs/current/errcodes-appendix.html */
  code: string;
  /** Human-readable error message (field code 'M') */
  message: string;
  /** Optional detail message, e.g. which key conflicted (field code 'D') */
  detail?: string;
  /** Hint for resolving the error (field code 'H') */
  hint?: string;
  /** Name of the schema involved (field code 's') */
  schema?: string;
  /** Name of the table involved (field code 't') */
  table?: string;
  /** Name of the column involved (field code 'c') */
  column?: string;
  /** Name of the data type involved (field code 'd') */
  dataType?: string;
  /** Name of the constraint that was violated (field code 'n') */
  constraint?: string;
  /** Source file where the error originated in the PG backend (field code 'F') */
  file?: string;
  /** Line number in that source file (field code 'L') */
  line?: string;
  /** Name of the routine that raised the error (field code 'R') */
  routine?: string;
}

// PostgreSQL error codes — see https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  QUERY_CANCELED: '57014', // triggered by statement_timeout
  LOCK_NOT_AVAILABLE: '55P03', // triggered by lock_timeout
  TOO_MANY_CONNECTIONS: '53300',
} as const;

export function resolveDbStatus(code: string): number {
  switch (code) {
    case PG_ERROR.UNIQUE_VIOLATION:
      return HttpStatus.CONFLICT;
    case PG_ERROR.FOREIGN_KEY_VIOLATION:
    case PG_ERROR.NOT_NULL_VIOLATION:
      return HttpStatus.UNPROCESSABLE_ENTITY;
    case PG_ERROR.QUERY_CANCELED:
    case PG_ERROR.LOCK_NOT_AVAILABLE:
      return HttpStatus.REQUEST_TIMEOUT;
    case PG_ERROR.TOO_MANY_CONNECTIONS:
      return HttpStatus.SERVICE_UNAVAILABLE;
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

/** Safe user-facing message for a PG error code — never leaks SQL, table names, or constraints. */
export function toDbErrorDetail(code: string): string {
  switch (code) {
    case PG_ERROR.UNIQUE_VIOLATION:
      return 'A record with the same unique value already exists';
    case PG_ERROR.FOREIGN_KEY_VIOLATION:
      return 'The referenced record does not exist';
    case PG_ERROR.NOT_NULL_VIOLATION:
      return 'A required field was not provided';
    case PG_ERROR.QUERY_CANCELED:
      return 'The request timed out — please try again';
    case PG_ERROR.LOCK_NOT_AVAILABLE:
      return 'The resource is currently locked — please try again';
    case PG_ERROR.TOO_MANY_CONNECTIONS:
      return 'The service is temporarily unavailable — please try again later';
    default:
      return 'A database error occurred';
  }
}
