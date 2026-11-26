import {IncomingHttpHeaders} from 'node:http';

// Logto configuration - replace with your actual values
export const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://localhost:3001';
export const JWKS_URI = `${LOGTO_ENDPOINT}/oidc/jwks`;
export const ISSUER = process.env.LOGTO_ISSUER || `${LOGTO_ENDPOINT}/oidc`;

/**
 * Authentication information extracted from JWT token
 */
export class AuthInfo {
  constructor(
    public sub: string,
    public clientId?: string,
    public organizationId?: string,
    public scopes: string[] = [],
    public audience: string[] = [],
    public roles: string[] = [],
  ) {}

  /**
   * Check if the user has access to a specific location
   * @param locationId The location ID (Logto organization ID) to check
   * @returns true if the user has access to this location
   */
  public hasLocationAccess(locationId: string): boolean {
    return this.organizationId === locationId;
  }

  /**
   * Get the user's current location ID
   * Alias for organizationId to avoid direct organization terminology
   */
  public get locationId(): string | undefined {
    return this.organizationId;
  }

  /**
   * Get the user ID
   * Alias for sub to provide clearer naming
   */
  public get userId(): string {
    return this.sub;
  }
}

/**
 * Custom error for authorization failures
 */
export class AuthorizationError extends Error {
  override name = 'AuthorizationError';

  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerTokenFromHeaders({authorization}: IncomingHttpHeaders): string {
  const bearerPrefix = 'Bearer ';

  if (!authorization) {
    throw new AuthorizationError('Authorization header is missing', 401);
  }

  if (!authorization.startsWith(bearerPrefix)) {
    throw new AuthorizationError(`Authorization header must start with "${bearerPrefix}"`, 401);
  }

  return authorization.slice(bearerPrefix.length);
}
