/**
 * Common Payment Types
 * Shared across multiple entities for payment processing
 */

/**
 * Credit card information (tokenized for security)
 * Never stores full card numbers - only last 4 digits and payment gateway token
 */
export interface CreditCardSummary {
  id?: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  token?: string; // Payment gateway token (e.g., Stripe, Square)
}
