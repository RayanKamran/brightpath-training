import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {useTranslation} from 'react-i18next';

// Language labels are proper nouns — displayed in the native language, not translated
const LANGUAGES = [
  {code: 'en', label: 'English'},
  {code: 'fr', label: 'Français'},
] as const;

type LanguageSwitcherProps = {
  disabled?: boolean;
};

export function LanguageSwitcher({disabled = false}: LanguageSwitcherProps) {
  const {i18n} = useTranslation();
  const current = i18n.language?.split('-')[0] || 'en';

  return (
    <Select
      value={current}
      disabled={disabled}
      onChange={(e) => i18n.changeLanguage(e.target.value as string)}
      size="small"
      variant="outlined"
      sx={{
        color: 'inherit',
        '& .MuiOutlinedInput-notchedOutline': {border: 'none'},
        '&.Mui-disabled': {
          cursor: 'not-allowed',
          pointerEvents: 'auto',
        },
        '& .MuiSelect-select.Mui-disabled': {
          cursor: 'not-allowed',
          WebkitTextFillColor: 'currentColor',
        },
        '& .MuiSvgIcon-root': {
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
      }}
    >
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  );
}
