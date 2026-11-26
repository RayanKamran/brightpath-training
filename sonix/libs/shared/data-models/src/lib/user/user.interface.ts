import type {DmsBaseEntity} from '../common/dms-base-entity.interface.js';

/**
 * User Domain Models
 *
 * Application-specific user profile data stored in RavenDB.
 * Complements Logto authentication with custom application fields.
 */

/**
 * Core User entity
 */
export interface User extends DmsBaseEntity {
  logtoUserId: string; // Logto user ID (sub claim from JWT)
  email: string; // Primary email (synced from Logto)
  username?: string | null; // Username (synced from Logto)

  // Custom application fields
  nickname?: string | null;
  displayName?: string | null;
  bio?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;

  // Application preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;

  // Profile metadata
  profileCompleteness: number; // 0-100 percentage
  lastLoginAt?: Date | null;
  hasProfilePhoto?: boolean;
}

/**
 * User list item (minimal fields for list views)
 */
export interface UserListItem {
  id: string;
  logtoUserId: string;
  email: string;
  username?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  profileCompleteness: number;
  lastLoginAt?: Date | null;
  createdAt: Date;
}

/**
 * Paginated user list response
 */
export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
