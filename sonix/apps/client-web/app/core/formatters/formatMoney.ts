/**
 * Converts a Money amount (integer minor units / cents) to a display number (major units / dollars).
 *
 * @example moneyToDisplay({ amount: 2899, currency: 'USD' }) → 28.99
 * @example moneyToDisplay(null) → 0
 */
export function moneyToDisplay(money: {amount: number} | null | undefined): number {
  if (!money) {
    return 0;
  }
  return money.amount / 100;
}

/**
 * Parse a potentially locale-formatted numeric string into a plain number.
 * Strips grouping separators (commas, spaces) but preserves the decimal point and sign.
 *
 * Returns `NaN` for empty or non-numeric input — always check with `Number.isNaN()`.
 *
 * @example parseMoneyInput('1,234.5000') → 1234.5
 * @example parseMoneyInput('28.99') → 28.99
 * @example parseMoneyInput('') → NaN
 */
export function parseMoneyInput(value: string): number {
  if (!value || value.trim() === '') {
    return NaN;
  }
  const cleaned = value.replace(/[^0-9.-]/g, '');

  return parseFloat(cleaned);
}

/**
 * Parse a locale-formatted numeric string into a plain number.
 *
 * Uses `Intl.NumberFormat` to detect the locale's decimal separator, strips everything
 * that isn't a digit, minus, or decimal separator, then normalises the decimal to '.'.
 *
 * Returns `NaN` for empty or non-numeric input.
 *
 * @example parseLocaleNumber('1,234.567', 'en') → 1234.567
 * @example parseLocaleNumber('1 234,567', 'fr') → 1234.567
 */
export function parseLocaleNumber(value: string, locale: string): number {
  if (!value || value.trim() === '') {
    return NaN;
  }

  const decimalSep =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ??
    '.';

  const normalized = value
    .replace(new RegExp(`[^0-9\\-${decimalSep === '.' ? '\\.' : decimalSep}]`, 'g'), '')
    .replace(decimalSep, '.');

  return parseFloat(normalized);
}
