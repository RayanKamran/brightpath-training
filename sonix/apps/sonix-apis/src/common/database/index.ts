/**
 * This module provides:
 * - Query limit enforcement and validation
 * - Safe repository wrappers with built-in protections
 * - Database operation monitoring and logging
 */

// PostgreSQL error codes and helpers
export {PG_ERROR, type PgQueryError, resolveDbStatus, toDbErrorDetail} from './pg-error';
