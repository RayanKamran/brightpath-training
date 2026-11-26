export type ProblemDetailDto = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Array<{field: string; message: string}>;
};

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetailDto) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }

  get status(): number {
    return this.problem.status;
  }

  get type(): string | undefined {
    return this.problem.type;
  }
}

export class NetworkOfflineError extends Error {
  constructor() {
    super('No network connection');
    this.name = 'NetworkOfflineError';
  }
}

export class ServerUnreachableError extends Error {
  constructor() {
    super('Server unreachable');
    this.name = 'ServerUnreachableError';
  }
}

export class RequestTimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'RequestTimeoutError';
  }
}

export function isTransientError(error: unknown): boolean {
  return (
    error instanceof NetworkOfflineError ||
    error instanceof ServerUnreachableError ||
    error instanceof RequestTimeoutError
  );
}
