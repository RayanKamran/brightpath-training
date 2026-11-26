/**
 * DTO for creating a new user profile
 * Called when a user first registers via Logto
 */
export interface CreateUserDto {
  logtoUserId: string;
  email: string;
  username?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  bio?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  profileCompleteness?: number;
}
