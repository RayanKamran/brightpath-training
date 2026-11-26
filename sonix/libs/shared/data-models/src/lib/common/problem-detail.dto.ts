/** RFC 9457 Problem Details — shared between backend and frontend */
export type ProblemDetailDto = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  location?: string | null;
  userId?: string | null;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  timestamp?: string;
  /** Field-level validation errors (populated on 400 validation failures) */
  errors?: ProblemFieldError[];
};

export type ProblemFieldError = {
  field: string;
  message: string;
};

/** Stable URN error type catalog — machine-readable identifiers */
export const PROBLEM_URN_TYPE = {
  VALIDATION: 'urn:dms:error:validation',
  UNAUTHORIZED: 'urn:dms:error:unauthorized',
  FORBIDDEN: 'urn:dms:error:forbidden',
  NOT_FOUND: 'urn:dms:error:not-found',
  CONFLICT: 'urn:dms:error:conflict',
  TOO_MANY_REQUESTS: 'urn:dms:error:too-many-requests',
  INTERNAL: 'urn:dms:error:internal',
  SERVICE_UNAVAILABLE: 'urn:dms:error:service-unavailable',
} as const;

export type ProblemUrnType = (typeof PROBLEM_URN_TYPE)[keyof typeof PROBLEM_URN_TYPE];
