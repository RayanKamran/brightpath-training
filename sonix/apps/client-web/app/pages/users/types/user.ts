export type SalespersonListItem = {
  id: string;
  displayName: string;
  email: string;
};

export type UserProfile = {
  id: string;
  logtoUserId: string;
  email: string;
  username: string | null;
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  profileCompleteness: number;
  lastLoginAt: string | null;
  hasProfilePhoto: boolean;
  createdDate: string;
  updatedDate: string;
};

export type UpdateUserInput = {
  displayName?: string | null;
  bio?: string | null;
  timezone?: string | null;
  preferredLanguage?: string | null;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
};

export type UserSearchCriteria = {
  searchTerm?: string;
};
