/**
 * Locale-aware number formatter. Pure function — safe to call outside React components.
 *
 * When no `options` are provided, `minimumFractionDigits` is inferred from the
 * value itself so fractional digits are preserved automatically.
 * When either `minimumFractionDigits` or `maximumFractionDigits` is explicitly
 * set, the caller has full control and auto-inference is skipped.
 *
 * Returns `'-'` for `null` or `undefined` values.
 *
 * @param value - The number to format.
 * @param locale - BCP 47 language tag (e.g. `'en'`, `'fr'`).
 * @param options - Optional `Intl.NumberFormatOptions` to customise formatting.
 */
export function formatNumber(
  value: number | null | undefined,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (!value) {
    return '-';
  }
  const hasExplicitFractionOptions =
    !options?.minimumFractionDigits || !options?.maximumFractionDigits;

  if (hasExplicitFractionOptions) {
    return new Intl.NumberFormat(locale, options).format(value);
  }

  const minimumFractionDigits = value.toString().split('.')[1]?.length ?? 0;
  return new Intl.NumberFormat(locale, {minimumFractionDigits, ...options}).format(value);
}
