import {useTranslation} from 'react-i18next';
import {formatCurrency} from '../formatters/formatCurrency';

/**
 * Returns a locale-aware currency formatter function that uses the active i18n language.
 *
 * Formats values using `Intl.NumberFormat` with `style: 'currency'`, automatically
 * adapting the number grouping, decimal separator, and symbol placement to the
 * current locale.
 *
 * Returns `'-'` for `null` or `undefined` values.
 *
 * @param currency - ISO 4217 currency code. Defaults to `'USD'`.
 * @param options - Optional `Intl.NumberFormatOptions` to override formatting defaults.
 *                  `style` and `currency` are always set and cannot be overridden.
 *
 * @example
 * // Default USD
 * const format = useFormatCurrency();
 * format(1234.5);    // → "$1,234.50" (en) | "1 234,50 $US" (fr)
 * format(null);      // → "-"
 *
 * @example
 * // Euros
 * const format = useFormatCurrency('EUR');
 * format(1234.5);    // → "€1,234.50" (en) | "1 234,50 €" (fr)
 *
 * @example
 * // Canadian dollars
 * const format = useFormatCurrency('CAD');
 * format(99.99);     // → "CA$99.99" (en) | "99,99 $ CA" (fr)
 *
 * @example
 * // No decimal places
 * const format = useFormatCurrency('USD', { maximumFractionDigits: 0 });
 * format(1234.5);    // → "$1,235"
 *
 * @example
 * // Always 4 decimal places
 * const format = useFormatCurrency('USD', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
 * format(1.5);       // → "$1.5000"
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat for all available formatting options.
 */
export function useFormatCurrency(
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  currency = 'USD',
) {
  const {i18n} = useTranslation();

  return (value: number | null | undefined): string =>
    formatCurrency(value, i18n.language, currency, options);
}
