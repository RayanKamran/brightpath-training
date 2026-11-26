import TextField from '@mui/material/TextField';
import {parseLocaleNumber} from 'core/formatters/formatMoney';
import {useFormatNumber} from 'core/hooks/useFormatNumber';
import {useEffect, useRef} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {useTranslation} from 'react-i18next';

type DecimalFieldProps = {
  /** RHF field name */
  name: string;
  /** Input label */
  label: string;
  /** Number of decimal places (default 3) */
  decimals?: number;
  disabled?: boolean;
  'data-testid'?: string;
};

const fieldSx = {
  '& .MuiInputBase-root': {fontSize: '0.875rem'},
  '& .MuiInputLabel-root': {fontSize: '0.875rem'},
} as const;

/**
 * MUI TextField wrapper for decimal number input with RHF Controller.
 *
 * Handles:
 * - Locale-aware formatting on blur and on language change (e.g. "1" → "1.000")
 * - Scroll wheel prevention
 * - Parsing locale-formatted strings back to numbers on submit
 *
 * The field value is stored as a string in RHF state. Use `parseLocaleNumber()` to
 * convert to a number before sending to the API.
 */
export function DecimalField({
  name,
  label,
  decimals = 3,
  disabled,
  'data-testid': testId,
}: DecimalFieldProps) {
  const {control} = useFormContext();
  const {field, fieldState} = useController({name, control});
  const {i18n} = useTranslation();
  const formatDec = useFormatNumber({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const fieldRef = useRef(field);
  fieldRef.current = field;
  const formatDecRef = useRef(formatDec);
  formatDecRef.current = formatDec;
  const prevLangRef = useRef(i18n.language);

  // Re-format the stored value whenever the active language changes.
  // Parse with the PREVIOUS locale (the value is formatted in that locale),
  // then format with the NEW locale via formatDec (already uses new language).
  useEffect(() => {
    const prevLang = prevLangRef.current;
    prevLangRef.current = i18n.language;
    if (prevLang === i18n.language) {
      return;
    }

    const val = String(fieldRef.current.value ?? '').trim();
    if (!val) {
      return;
    }
    const num = parseLocaleNumber(val, prevLang);
    if (!Number.isNaN(num)) {
      fieldRef.current.onChange(formatDecRef.current(num));
    }
  }, [i18n.language]);

  return (
    <TextField
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={() => {
        const val = String(field.value ?? '').trim();
        if (val) {
          const num = parseLocaleNumber(val, i18n.language);
          if (!Number.isNaN(num)) {
            field.onChange(formatDec(num));
          }
        }
        field.onBlur();
      }}
      label={label}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      disabled={disabled}
      size="small"
      sx={fieldSx}
      slotProps={{
        htmlInput: {
          'data-testid': testId,
          onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
            e.currentTarget.blur();
          },
        },
      }}
    />
  );
}
