import type {JWTPayload} from 'jose';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {AuthInfo, AuthorizationError, ISSUER, JWKS_URI} from './auth-utils';

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

/**
 * Validate JWT token from Logto
 */
export async function validateJwt(token: string): Promise<JWTPayload> {
  const {payload} = await jwtVerify(token, jwks, {
    issuer: ISSUER,
  });

  verifyPayload(payload);
  return payload;
}

/**
 * Create AuthInfo from JWT payload
 */
export function createAuthInfo(payload: JWTPayload): AuthInfo {
  const scopes = (payload.scope as string)?.split(' ') ?? [];
  const audience = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((value): value is string => typeof value === 'string')
    : [];

  if (!payload.sub) {
    throw new AuthorizationError('Invalid token: missing subject claim');
  }

  // Extract organization ID from either the organization_id claim or the aud claim
  // Logto organization tokens have aud like "urn:logto:organization:i5fjpgjjfon8"
  let organizationId = payload.organization_id as string | undefined;

  if (!organizationId && audience.length > 0) {
    // Try to extract from aud claim
    const orgAudience = audience.find((aud: string) => aud.startsWith('urn:logto:organization:'));
    if (orgAudience) {
      organizationId = orgAudience.replace('urn:logto:organization:', '');
    }
  }

  return new AuthInfo(
    payload.sub,
    payload.client_id as string,
    organizationId,
    scopes,
    audience,
    roles,
  );
}

/**
 * Verify payload based on your permission model
 * For Global API Resources:
 * - Check audience claim matches your API resource indicator
 * - Validate required scopes
 */
function verifyPayload(payload: JWTPayload): void {
  // Optional: Add audience validation if you have an API resource registered
  // const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  // if (!audiences.includes('https://api.your-app.com')) {
  //   throw new AuthorizationError('Invalid audience');
  // }

  // Optional: Add scope validation if you need specific permissions
  // const requiredScopes = ['read:customers']; // Replace with your actual required scopes
  // const scopes = (payload.scope as string)?.split(' ') ?? [];
  // if (!requiredScopes.every((scope) => scopes.includes(scope))) {
  //   throw new AuthorizationError('Insufficient scope');
  // }

  // Basic validation - ensure token has required claims
  if (!payload.sub) {
    throw new AuthorizationError('Invalid token: missing subject claim');
  }
}
