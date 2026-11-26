import {useTranslation} from 'react-i18next';
import {formatNumber} from '../formatters/formatNumber';

/**
 * Returns a locale-aware number formatter function that uses the active i18n language.
 *
 * When no `options` are provided, `minimumFractionDigits` is inferred from the
 * value itself so fractional digits are preserved automatically.
 * When either `minimumFractionDigits` or `maximumFractionDigits` is explicitly
 * set, the caller has full control and auto-inference is skipped.
 *
 * Returns `'-'` for `null` or `undefined` values.
 *
 * @param options - Optional `Intl.NumberFormatOptions` to customise formatting.
 *
 * @example
 *  // Whole numbers only (e.g. on-hand quantity)
 * const format = useFormatNumber({ maximumFractionDigits: 0 });
 * format(1234.9); // → "1,235" (en) | "1 235" (fr)
 *
 * @example
 *  // Always show 2 decimal places (e.g. weight, percentage)
 * const format = useFormatNumber({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
 * format(22);    // → "22.00"
 * format(22.5);  // → "22.50"
 *
 * @example
 *  // Preserve as many decimals as the value has (default behaviour)
 * const format = useFormatNumber();
 * format(22);    // → "22"
 * format(22.5);  // → "22.5"
 * format(22.567); // → "22.567"
 *
 * @example
 *  // Compact large numbers
 * const format = useFormatNumber({ notation: 'compact' });
 * format(1500000); // → "1.5M" (en)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat for all available formatting options.
 */

export function useFormatNumber(options?: Intl.NumberFormatOptions) {
  const {i18n} = useTranslation();

  return (value: number | null | undefined): string => formatNumber(value, i18n.language, options);
}
