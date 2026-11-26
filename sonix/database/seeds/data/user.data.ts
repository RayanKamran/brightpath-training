/**
 * User seed data.
 * These are application-level user profiles stored in RavenDB.
 * Document ID format: users/{logtoUserId}
 *
 * logtoUserId values match the IDs assigned by Logto when `npm run logto:seed` is run
 * and are stable after `npm run logto:db:import-init-config`.
 *
 * Logto is the source of truth for identity (email, username, displayName).
 * The fields below (bio, timezone, notifications, etc.) are dms_sonix profile data.
 */
export type UserSeedData = {
  id: string;
  logtoUserId: string;
  displayName: string;
  email: string;
  username: string;
  bio?: string | null;
  timezone?: string | null;
  preferredLanguage?: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  profileCompleteness: number;
};

export const userSeedData: UserSeedData[] = [
  {
    id: 'users/adminacmecom',
    logtoUserId: 'adminacmecom',
    displayName: 'Admin User',
    email: 'admin@acme-rv.com',
    username: 'admin',
    bio: null,
    timezone: 'America/New_York',
    preferredLanguage: 'en',
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    profileCompleteness: 80,
  },
  {
    id: 'users/aliceacmecom',
    logtoUserId: 'aliceacmecom',
    displayName: 'Alice Accounting',
    email: 'alice@acme-rv.com',
    username: 'alice',
    bio: 'Accounts payable and receivable manager across multiple locations.',
    timezone: 'America/Chicago',
    preferredLanguage: 'en',
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    profileCompleteness: 90,
  },
  {
    id: 'users/mikeacmecomm',
    logtoUserId: 'mikeacmecomm',
    displayName: 'Mike Mechanic',
    email: 'mike@acme-rv.com',
    username: 'mike',
    bio: 'Certified RV technician based at HQ.',
    timezone: 'America/New_York',
    preferredLanguage: 'en',
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    profileCompleteness: 85,
  },
  {
    id: 'users/sarahacmecom',
    logtoUserId: 'sarahacmecom',
    displayName: 'Sarah Sales',
    email: 'sarah@acme-rv.com',
    username: 'sarah',
    bio: 'Sales specialist with a focus on customer experience.',
    timezone: 'America/Denver',
    preferredLanguage: 'en',
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    profileCompleteness: 75,
  },
  {
    id: 'users/timacmecomti',
    logtoUserId: 'timacmecomti',
    displayName: 'Tim Techsupport',
    email: 'tim@acme-rv.com',
    username: 'tim',
    bio: 'Technical support and systems specialist.',
    timezone: 'America/Los_Angeles',
    preferredLanguage: 'en',
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    profileCompleteness: 70,
  },
];
