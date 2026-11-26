/**
 * Supported ISO 4217 currency codes.
 * Extend this union as new jurisdictions are onboarded.
 */
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'MXN';

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  'CAD',
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'MXN',
];

/**
 * A monetary value paired with its currency.
 *
 * `amount` is always an integer in the currency's minor unit (cents for USD/CAD/EUR/GBP/AUD/MXN).
 * Storing as an integer completely eliminates IEEE 754 floating-point representation errors —
 * 12.99 cannot be stored exactly as a float, but 1299 is a perfectly exact integer.
 *
 * Never use a bare `number` for a monetary value. Every monetary field must be typed as `Money`
 * so that the currency is always explicit and arithmetic always goes through the helpers below.
 */
export interface Money {
  /** Integer minor units (cents). 1299 means $12.99 USD. */
  amount: number;
  /** ISO 4217 currency code. */
  currency: CurrencyCode;
}

// ── Constructors ──────────────────────────────────────────────────────────────

/**
 * Parse a user-entered decimal string or number into a Money value.
 * Call this exactly once, at the input boundary (form submit), to convert user input to Money.
 * Never pass raw floats or decimal strings across component or API boundaries.
 */
export function toMoney(value: number | string, currency: CurrencyCode): Money {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  return {amount: Math.round((Number.isNaN(num) ? 0 : num) * 100), currency};
}

/** Zero value for a given currency. */
export function zeroMoney(currency: CurrencyCode): Money {
  return {amount: 0, currency};
}

// ── Arithmetic ────────────────────────────────────────────────────────────────

/**
 * Add two Money values. Throws if currencies differ — never silently mix currencies.
 * Use this for all additive money operations.
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} + ${b.currency}`);
  }
  return {amount: a.amount + b.amount, currency: a.currency};
}

/**
 * Subtract b from a. Throws if currencies differ.
 * The result may be negative (e.g. net trade = allowance − payoff when payoff > allowance).
 */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} - ${b.currency}`);
  }
  return {amount: a.amount - b.amount, currency: a.currency};
}

/**
 * Multiply a Money value by a scalar (e.g. quantity or unit count).
 * Rounds to the nearest minor unit using Math.round().
 */
export function multiplyMoney(money: Money, scalar: number): Money {
  return {amount: Math.round(money.amount * scalar), currency: money.currency};
}

/**
 * Sum an array of Money values. All values must share the same currency.
 * Returns zeroMoney(currency) for an empty array.
 */
export function sumMoney(values: Money[], currency: CurrencyCode): Money {
  return values.reduce((acc, v) => addMoney(acc, v), {amount: 0, currency});
}

// ── Rate application ──────────────────────────────────────────────────────────

/**
 * Apply a rate expressed in basis points to a Money value and return the resulting amount.
 *
 * WHY BASIS POINTS: Rates are stored as integers (basis points) rather than decimals to avoid
 * floating-point representation errors. 6.25% stored as 0.0625 cannot be represented exactly
 * in IEEE 754 binary floating point; stored as 625 basis points it is an exact integer.
 * The formula `amount * basisPoints / 10000` keeps all intermediate values as integers
 * until the final division, minimising accumulated error.
 *
 * WHY Math.round(): The division always produces a non-integer result (e.g. 771.5625 cents).
 * Math.round() is the standard accounting convention — it rounds halves away from zero,
 * which is symmetric and ensures neither party (buyer nor seller) is systematically
 * advantaged by rounding. Math.floor() would always favour the payer; Math.ceil() would
 * always favour the payee. Never substitute either of those here.
 *
 * USE FOR: tax amounts, discounts, dealer fees, insurance premiums, interest calculations.
 * Do NOT use for splitting a total across multiple items — use allocateMoney() instead.
 *
 * Examples:
 *   applyRate({ amount: 12345, currency: 'USD' }, 625)   // 6.25% tax → { amount: 772, currency: 'USD' } ($7.72)
 *   applyRate({ amount: 50000, currency: 'CAD' }, 1000)  // 10% discount → { amount: 5000, currency: 'CAD' } ($50.00)
 */
export function applyRate(money: Money, basisPoints: number): Money {
  return {amount: Math.round((money.amount * basisPoints) / 10000), currency: money.currency};
}

// ── Allocation ────────────────────────────────────────────────────────────────

/**
 * Split a Money value across multiple shares using the largest remainder method,
 * guaranteeing the pieces always sum exactly to the original amount.
 *
 * WHY THIS EXISTS: Naïvely rounding each share independently almost always produces a
 * total that is off by one or more cents. For example, splitting 1000 cents three ways:
 *   Math.round(1000/3) × 3  →  333 + 333 + 333 = 999  ← 1 cent lost
 * In financial systems this is unacceptable — cents must be fully accounted for.
 *
 * HOW THE LARGEST REMAINDER METHOD WORKS:
 *   1. Give every share its floor (round-down) value. This guarantees we never overshoot.
 *   2. Count how many cents are left over (original − sum of floors).
 *   3. Distribute one extra cent each to the shares whose fractional remainder was
 *      largest (i.e. they were closest to deserving the next whole cent).
 * The result: pieces always sum exactly to the original, and the allocation is as fair
 * as possible — no share receives more than one extra cent beyond its floor.
 *
 * WHY NOT applyRate() INSTEAD: applyRate() computes a derived amount (e.g. a tax on a
 * base). allocateMoney() distributes an existing total — the semantics are different.
 * Use applyRate() when calculating what a rate produces; use allocateMoney() when
 * dividing a known total so that every cent lands somewhere.
 *
 * Pass ratios as plain numbers in any unit — they do not need to sum to any particular
 * value. The function normalises them internally.
 *
 * USE FOR: prorating freight across units, splitting a shared fee across line items,
 * distributing a rebate proportionally, dividing a down payment across periods.
 *
 * Example — split $10.00 three ways:
 *   allocateMoney({ amount: 1000, currency: 'USD' }, [1, 1, 1])
 *   → [{ amount: 334 }, { amount: 333 }, { amount: 333 }]  // 334 + 333 + 333 = 1000 ✓
 *
 * Example — prorate a $50 freight charge across units worth $200 and $300:
 *   allocateMoney({ amount: 5000, currency: 'USD' }, [200, 300])
 *   → [{ amount: 2000 }, { amount: 3000 }]  // $20.00 + $30.00 = $50.00 ✓
 */
export function allocateMoney(money: Money, ratios: number[]): Money[] {
  if (ratios.length === 0) {
    return [];
  }
  const total = ratios.reduce((sum, r) => sum + r, 0);
  if (total === 0) {
    throw new Error('allocateMoney: ratios must not all be zero');
  }

  const shares = ratios.map((r) => Math.floor((money.amount * r) / total));
  const remainders = ratios.map((r, i) => (money.amount * r) / total - shares[i]);
  const leftover = money.amount - shares.reduce((sum, s) => sum + s, 0);

  // Distribute leftover cents to the indices with the largest fractional remainders
  const order = remainders
    .map((r, i) => ({r, i}))
    .sort((a, b) => b.r - a.r)
    .map((x) => x.i);

  for (let k = 0; k < leftover; k++) {
    shares[order[k]]++;
  }

  return shares.map((amount) => ({amount, currency: money.currency}));
}

// ── Formatting ────────────────────────────────────────────────────────────────

/**
 * Format a Money value for display using the Intl.NumberFormat API.
 * Call this only at the final render layer — never store or pass formatted strings
 * as monetary values.
 *
 * Defaults to 'en-CA' locale so both CAD and USD render with the appropriate symbol
 * and grouping. Pass an explicit locale when the user's locale is known.
 */
export function formatMoney(money: Money, locale = 'en-CA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount / 100);
}
