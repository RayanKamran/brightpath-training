/**
 * Email Address Types
 *
 * Enterprise-grade email address types supporting RFC 5322 standard,
 * validation, verification, deliverability checking, and compliance.
 *
 * Standards:
 * - RFC 5322: Internet Message Format (email address syntax)
 * - RFC 6531: SMTPUTF8 (internationalized email addresses)
 * - RFC 2822: Email header format
 */

/**
 * Email address type classification
 */
export type EmailAddressType =
  | 'personal' // Personal email
  | 'work' // Work/business email
  | 'billing' // Billing and invoices
  | 'shipping' // Shipping notifications
  | 'correspondence' // General correspondence
  | 'support' // Customer support
  | 'sales' // Sales inquiries
  | 'marketing' // Marketing communications
  | 'technical' // Technical contact
  | 'security' // Security notifications
  | 'noreply' // No-reply address (outbound only)
  | 'other'; // Other/unclassified

/**
 * Email verification status
 */
export type EmailVerificationStatus =
  | 'unverified' // Not yet verified
  | 'verified' // Verified via email confirmation
  | 'bounced' // Email bounced (hard bounce)
  | 'invalid' // Failed validation (syntax/domain)
  | 'disposable' // Disposable/temporary email detected
  | 'risky' // High-risk domain or pattern
  | 'expired' // Verification expired
  | 'pending'; // Verification pending

/**
 * Email deliverability status
 */
export type EmailDeliverabilityStatus =
  | 'deliverable' // Email is deliverable
  | 'undeliverable' // Email is not deliverable
  | 'risky' // Deliverability uncertain
  | 'unknown'; // Deliverability unknown

/**
 * Email bounce type
 */
export type EmailBounceType =
  | 'hard' // Permanent failure (invalid address)
  | 'soft' // Temporary failure (mailbox full, server down)
  | 'block' // Blocked by recipient server
  | 'spam' // Marked as spam
  | 'none'; // No bounces

/**
 * Email verification details
 */
export interface EmailVerificationDetails {
  /** Verification method used */
  method?: 'link' | 'code' | 'magic-link' | 'oauth' | 'manual';
  /** Verification token sent (for audit) */
  token?: string;
  /** Number of verification attempts */
  attempts?: number;
  /** Last verification attempt timestamp */
  lastAttempt?: Date;
  /** Verification expiry date */
  expiresAt?: Date;
  /** Verification provider (SendGrid, AWS SES, etc.) */
  provider?: string;
  /** IP address used for verification */
  verificationIp?: string;
  /** User agent used for verification */
  verificationUserAgent?: string;
}

/**
 * Email deliverability information
 */
export interface EmailDeliverabilityInfo {
  /** Overall deliverability status */
  status: EmailDeliverabilityStatus;
  /** MX records exist for domain */
  mxRecordsFound?: boolean;
  /** SMTP connection successful */
  smtpValid?: boolean;
  /** Mailbox exists on server */
  mailboxExists?: boolean;
  /** Domain has valid SPF record */
  spfValid?: boolean;
  /** Domain has valid DKIM */
  dkimValid?: boolean;
  /** Domain has valid DMARC */
  dmarcValid?: boolean;
  /** Free email provider (Gmail, Yahoo, etc.) */
  isFreeProvider?: boolean;
  /** Disposable/temporary email service */
  isDisposable?: boolean;
  /** Role-based email (info@, admin@, etc.) */
  isRoleBasedAddress?: boolean;
  /** Catch-all domain (accepts all emails) */
  isCatchAll?: boolean;
  /** Last deliverability check date */
  lastChecked?: Date;
  /** Deliverability score (0-100) */
  score?: number;
}

/**
 * Email bounce history
 */
export interface EmailBounceInfo {
  /** Total bounce count */
  bounceCount: number;
  /** Last bounce date */
  lastBounceDate?: Date;
  /** Last bounce type */
  lastBounceType?: EmailBounceType;
  /** Last bounce reason */
  lastBounceReason?: string;
  /** Hard bounce count */
  hardBounceCount?: number;
  /** Soft bounce count */
  softBounceCount?: number;
  /** Consecutive bounces */
  consecutiveBounces?: number;
}

/**
 * Email engagement metrics
 */
export interface EmailEngagementMetrics {
  /** Total emails sent */
  sentCount?: number;
  /** Total emails opened */
  openedCount?: number;
  /** Total clicks */
  clickedCount?: number;
  /** Last email opened date */
  lastOpenedDate?: Date;
  /** Last email clicked date */
  lastClickedDate?: Date;
  /** Open rate (0-100) */
  openRate?: number;
  /** Click rate (0-100) */
  clickRate?: number;
  /** Marked as spam count */
  spamComplaintCount?: number;
  /** Unsubscribe count */
  unsubscribeCount?: number;
}

/**
 * Email address interface
 *
 * Comprehensive email type supporting RFC 5322 standard,
 * validation, verification, deliverability, and engagement tracking.
 */
export interface EmailAddress {
  // Identification
  /** Unique identifier */
  id?: string;
  /** Email type classification */
  type: EmailAddressType;
  /** Optional label (e.g., "Primary Work", "Billing Contact") */
  label?: string;
  /** Primary email flag */
  isPrimary?: boolean;

  // Email Address
  /**
   * Complete email address (RFC 5322 compliant)
   * Format: local-part@domain
   * Example: john.doe@example.com
   */
  address: string;

  // Structured Components
  /**
   * Local part (before @)
   * Example: "john.doe" from john.doe@example.com
   */
  localPart?: string;

  /**
   * Domain part (after @)
   * Example: "example.com" from john.doe@example.com
   */
  domain?: string;

  /**
   * Display name (optional)
   * Example: "John Doe" in "John Doe <john.doe@example.com>"
   */
  displayName?: string;

  /**
   * RFC 5322 formatted address with display name
   * Example: "John Doe <john.doe@example.com>"
   */
  formatted?: string;

  // Validation & Verification
  /**
   * Email verification status
   */
  verificationStatus?: EmailVerificationStatus;

  /**
   * Date when email was verified
   */
  verificationDate?: Date;

  /**
   * Verification details
   */
  verificationDetails?: EmailVerificationDetails;

  /**
   * Whether email syntax is valid
   */
  isValid?: boolean;

  /**
   * Whether domain exists and has MX records
   */
  isDomainValid?: boolean;

  // Deliverability
  /**
   * Deliverability information
   */
  deliverability?: EmailDeliverabilityInfo;

  /**
   * Bounce history
   */
  bounceInfo?: EmailBounceInfo;

  // Domain Classification
  /**
   * Email provider/service (Gmail, Outlook, Corporate, etc.)
   */
  provider?: string;

  /**
   * Whether email is from a free provider (Gmail, Yahoo, etc.)
   */
  isFreeEmail?: boolean;

  /**
   * Whether email is from a corporate domain
   */
  isCorporateEmail?: boolean;

  /**
   * Whether email is disposable/temporary
   */
  isDisposable?: boolean;

  /**
   * Whether email is role-based (info@, admin@, sales@, etc.)
   */
  isRoleBased?: boolean;

  // Preferences & Consent
  /**
   * User opted in for marketing emails
   */
  marketingConsent?: boolean;

  /**
   * Can receive transactional emails (order confirmations, etc.)
   */
  transactionalConsent?: boolean;

  /**
   * Can receive newsletter
   */
  newsletterConsent?: boolean;

  /**
   * Date when consent was given
   */
  consentDate?: Date;

  /**
   * IP address when consent was given
   */
  consentIp?: string;

  /**
   * Consent method (form, api, import, etc.)
   */
  consentMethod?: string;

  /**
   * User unsubscribed from marketing
   */
  isUnsubscribed?: boolean;

  /**
   * Date when user unsubscribed
   */
  unsubscribeDate?: Date;

  /**
   * Email frequency preference
   */
  emailFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';

  // Engagement
  /**
   * Engagement metrics
   */
  engagement?: EmailEngagementMetrics;

  /**
   * Email quality score (0-100)
   * Based on verification, deliverability, engagement
   */
  qualityScore?: number;

  // Search & Reporting
  /**
   * Normalized email for searching (lowercase, trimmed)
   * Example: "john.doe@example.com"
   */
  normalized?: string;

  /**
   * Email hash for privacy-preserving analytics
   * Example: MD5 or SHA256 hash
   */
  hash?: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  // Metadata
  /**
   * Free-form notes about this email
   */
  notes?: string;

  /**
   * Active status (soft delete support)
   */
  isActive?: boolean;

  /**
   * When this email became effective
   */
  validFrom?: Date;

  /**
   * When this email expires/expired
   */
  validTo?: Date;

  /**
   * Source of email (signup, import, manual, etc.)
   */
  source?: string;

  // Audit Trail
  /**
   * When this record was created
   */
  createdDate?: Date;

  /**
   * When this record was last updated
   */
  updatedDate?: Date;

  /**
   * User who created this record
   */
  createdBy?: string;

  /**
   * User who last updated this record
   */
  updatedBy?: string;
}

/**
 * Simplified email for basic use cases
 */
export interface SimpleEmail {
  /** Email address */
  address: string;
  /** Email type */
  type?: 'personal' | 'work' | 'other';
  /** Primary flag */
  isPrimary?: boolean;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Whether email is valid */
  isValid: boolean;
  /** Email address (normalized) */
  address?: string;
  /** Local part */
  localPart?: string;
  /** Domain part */
  domain?: string;
  /** Whether syntax is valid */
  isSyntaxValid?: boolean;
  /** Whether domain exists */
  isDomainValid?: boolean;
  /** Whether MX records exist */
  hasMxRecords?: boolean;
  /** Whether SMTP validation passed */
  isSmtpValid?: boolean;
  /** Whether disposable email */
  isDisposable?: boolean;
  /** Whether free email provider */
  isFreeProvider?: boolean;
  /** Whether role-based address */
  isRoleBased?: boolean;
  /** Email provider name */
  provider?: string;
  /** Validation error message */
  error?: string;
  /** Validation warnings */
  warnings?: string[];
  /** Deliverability score (0-100) */
  score?: number;
}

/**
 * Email verification request
 */
export interface EmailVerificationRequest {
  /** Email address to verify */
  address: string;
  /** Verification method */
  method: 'link' | 'code' | 'magic-link';
  /** Redirect URL after verification */
  redirectUrl?: string;
  /** Verification code length (for code method) */
  codeLength?: number;
  /** Expiration time in minutes */
  expirationMinutes?: number;
}

/**
 * Email verification response
 */
export interface EmailVerificationResponse {
  /** Whether verification was sent successfully */
  success: boolean;
  /** Verification token (for tracking) */
  token?: string;
  /** Expiration date */
  expiresAt?: Date;
  /** Error message if failed */
  error?: string;
}

/**
 * Email search criteria
 */
export interface EmailSearchCriteria {
  /** Search by address (partial or complete) */
  address?: string;
  /** Search by domain */
  domain?: string;
  /** Search by type */
  type?: EmailAddressType;
  /** Search by provider */
  provider?: string;
  /** Include only verified emails */
  verifiedOnly?: boolean;
  /** Include only deliverable emails */
  deliverableOnly?: boolean;
  /** Exclude bounced emails */
  excludeBounced?: boolean;
  /** Exclude disposable emails */
  excludeDisposable?: boolean;
  /** Include only active emails */
  activeOnly?: boolean;
  /** Include only emails with marketing consent */
  marketingConsentOnly?: boolean;
  /** Minimum quality score */
  minQualityScore?: number;
}

/**
 * Bulk email validation request
 */
export interface BulkEmailValidationRequest {
  /** Email addresses to validate */
  emails: Array<{
    address: string;
    id?: string;
  }>;
  /** Include deliverability check */
  checkDeliverability?: boolean;
  /** Include SMTP validation */
  checkSmtp?: boolean;
  /** Timeout per email (ms) */
  timeout?: number;
}

/**
 * Bulk email validation response
 */
export interface BulkEmailValidationResponse {
  /** Validation results */
  results: Array<EmailValidationResult & {id?: string}>;
  /** Total processed */
  total: number;
  /** Valid count */
  validCount: number;
  /** Invalid count */
  invalidCount: number;
  /** Disposable count */
  disposableCount: number;
  /** Processing time (ms) */
  processingTime?: number;
}

/**
 * Email bounce event
 */
export interface EmailBounceEvent {
  /** Email address */
  address: string;
  /** Bounce type */
  bounceType: EmailBounceType;
  /** Bounce reason */
  reason: string;
  /** Bounce date */
  date: Date;
  /** Email message ID */
  messageId?: string;
  /** Bounce diagnostic code */
  diagnosticCode?: string;
}

/**
 * Email engagement event
 */
export interface EmailEngagementEvent {
  /** Email address */
  address: string;
  /** Event type */
  eventType:
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'complained'
    | 'unsubscribed';
  /** Event date */
  date: Date;
  /** Campaign ID */
  campaignId?: string;
  /** Email message ID */
  messageId?: string;
  /** Link clicked (for click events) */
  linkUrl?: string;
  /** User agent */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
}
