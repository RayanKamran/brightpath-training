/**
 * Locale-aware currency formatter. Pure function — safe to call outside React components.
 *
 * Returns `'-'` for `null` or `undefined` values.
 *
 * @param value - The number to format.
 * @param locale - BCP 47 language tag (e.g. `'en'`, `'fr'`).
 * @param currency - ISO 4217 currency code. Defaults to `'USD'`.
 * @param options - Optional `Intl.NumberFormatOptions` to override formatting defaults.
 *                  `style` and `currency` are always set and cannot be overridden.
 */
export function formatCurrency(
  value: number | null | undefined,
  locale: string,
  currency = 'USD',
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
): string {
  if (!value) {
    return '-';
  }
  return new Intl.NumberFormat(locale, {style: 'currency', currency, ...options}).format(value);
}
