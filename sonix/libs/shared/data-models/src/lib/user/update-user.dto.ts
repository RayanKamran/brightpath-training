/**
 * DTO for updating an existing user profile
 * Users can update their own profile information
 */
export interface UpdateUserDto {
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
