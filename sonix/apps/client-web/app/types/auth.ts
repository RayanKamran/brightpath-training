import type {IdTokenClaims as LogtoIdTokenClaims} from '@logto/react';

/**
 * Extended user claims interface that properly types the common OIDC claims
 * while still allowing additional custom claims from Logto.
 *
 * This addresses TypeScript's inference of `unknown` for properties when
 * IdTokenClaims is intersected with Record<string, unknown>.
 */
export interface UserClaims extends Omit<LogtoIdTokenClaims, keyof BaseUserClaims> {
  /** Subject (the user ID) of this token. */
  sub: string;
  /** Full name of the user. */
  name?: string | null;
  /** Username of the user. */
  username?: string | null;
  /** Email address of the user. */
  email?: string | null;
  /** Whether the user's email address has been verified. */
  email_verified?: boolean;
  /** Phone number of the user. */
  phone_number?: string | null;
  /** Whether the user's phone number has been verified. */
  phone_number_verified?: boolean;
  /** URL of the user's profile picture. */
  picture?: string | null;
  /** Organization IDs that the user has membership in. */
  organizations?: string[];
  /** Organization roles in format {organizationId}:{roleName} */
  organization_roles?: string[];
  /** Roles that the user has for API resources. */
  roles?: string[];
  /** Account creation timestamp (Unix epoch) */
  created_at?: number;
  /** Last update timestamp (Unix epoch) */
  updated_at?: number;
}

interface BaseUserClaims {
  sub: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  email_verified?: boolean;
  phone_number?: string | null;
  phone_number_verified?: boolean;
  picture?: string | null;
  organizations?: string[];
  organization_roles?: string[];
  roles?: string[];
  created_at?: number;
  updated_at?: number;
}

export type UserProfile = {
  id: string;
  logtoUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

export type Location = {
  id: string;
  name: string;
  displayName?: string;
  logtoId: string;
  description?: string;
  active?: boolean;
};
