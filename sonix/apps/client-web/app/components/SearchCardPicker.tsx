import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {useState} from 'react';

const fieldSx = {
  '& .MuiInputBase-root': {fontSize: '0.875rem'},
  '& .MuiInputLabel-root': {fontSize: '0.875rem'},
} as const;

// ── Types ──────────────────────────────────────────────────────────────────

export type CardPickerItem = {
  code: string;
  description: string | null;
  isMain?: boolean;
};

type SearchCardPickerProps = {
  /** Autocomplete label */
  label: string;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Header text above the card list (e.g. "Selected Bins (3)") */
  headerLabel?: string;
  /** Label for the primary chip badge */
  primaryLabel?: string;
  /** Tooltip for the primary radio when already primary */
  primaryTooltip?: string;
  /** Tooltip for the primary radio when not primary */
  setPrimaryTooltip?: string;
  /** Tooltip for the remove button */
  removeTooltip?: string;

  /** Dropdown options from search */
  options: Array<{code: string; description: string | null}>;
  /** Whether options are loading */
  loading?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Callback when search input changes (for debounced search) */
  onSearchChange: (query: string) => void;

  /** Currently selected items */
  items: CardPickerItem[];
  /** Callback when an item is added */
  onAdd: (item: {code: string; description: string | null}) => void;
  /** Callback when an item is removed by index */
  onRemove: (index: number) => void;
  /** Callback when primary is changed by index (only for multiple mode) */
  onSetPrimary?: (index: number) => void;

  /** Max height for the card list (scrollable) */
  maxHeight?: number;
};

// ── Component ──────────────────────────────────────────────────────────────

export function SearchCardPicker({
  label,
  placeholder,
  headerLabel,
  primaryLabel,
  primaryTooltip,
  setPrimaryTooltip,
  removeTooltip,
  options,
  loading = false,
  disabled = false,
  onSearchChange,
  items,
  onAdd,
  onRemove,
  onSetPrimary,
  maxHeight = 180,
}: SearchCardPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  const existingCodes = new Set(items.map((i) => i.code));
  const availableOptions = options.filter((o) => !existingCodes.has(o.code));
  const primaryItem = items.find((i) => i.isMain);
  const displayValue = focused ? inputValue : (primaryItem?.code ?? items[0]?.code ?? '');
  const showPrimary = !!onSetPrimary;

  const handleAdd = (opt: {code: string; description: string | null} | null) => {
    if (!opt || existingCodes.has(opt.code)) {
      return;
    }
    onAdd(opt);
    setSearchKey((k) => k + 1);
    setInputValue('');
    setFocused(false);
    onSearchChange('');
  };

  return (
    <Box>
      <Autocomplete<{code: string; description: string | null}>
        key={searchKey}
        options={availableOptions}
        getOptionLabel={(opt) => opt.code}
        renderOption={(props, opt) => (
          <li {...props} key={opt.code}>
            {opt.description ? `${opt.code} – ${opt.description}` : opt.code}
          </li>
        )}
        isOptionEqualToValue={(a, b) => a.code === b.code}
        value={null}
        inputValue={displayValue}
        onFocus={() => {
          setFocused(true);
          setInputValue('');
        }}
        onBlur={() => setFocused(false)}
        onChange={(_, value) => handleAdd(value)}
        onInputChange={(_, value, reason) => {
          if (reason === 'input') {
            setInputValue(value);
            onSearchChange(value);
          }
          if (reason === 'clear') {
            setInputValue('');
            onSearchChange('');
          }
        }}
        filterOptions={(x) => x}
        loading={loading}
        disabled={disabled}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            sx={fieldSx}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress color="inherit" size={14} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {items.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {headerLabel && (
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                bgcolor: 'action.hover',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {headerLabel}
              </Typography>
            </Box>
          )}
          <Box sx={{maxHeight, overflowY: 'auto'}}>
            {items.map((item, index) => {
              const isPrimary = item.isMain === true;
              return (
                <Box
                  key={item.code}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.75,
                    gap: 1,
                    borderBottom: index < items.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: isPrimary ? 'rgba(21,101,192,0.03)' : 'transparent',
                    '&:hover': {
                      bgcolor: isPrimary ? 'rgba(21,101,192,0.06)' : 'action.hover',
                    },
                    transition: 'background 0.12s',
                  }}
                >
                  <Box sx={{flex: 1, minWidth: 0}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: isPrimary ? 'primary.main' : 'text.primary',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.code}
                      </Typography>
                      {isPrimary && primaryLabel && (
                        <Chip
                          label={primaryLabel}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            borderRadius: '4px',
                            '& .MuiChip-label': {px: 0.75},
                          }}
                        />
                      )}
                    </Box>
                    {item.description && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                  {showPrimary && (
                    <Tooltip title={isPrimary ? (primaryTooltip ?? '') : (setPrimaryTooltip ?? '')}>
                      <span>
                        <Radio
                          checked={isPrimary}
                          onChange={() => onSetPrimary?.(index)}
                          size="small"
                          sx={{
                            p: 0.5,
                            color: 'text.disabled',
                            '&.Mui-checked': {color: 'primary.main'},
                          }}
                        />
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title={removeTooltip ?? ''}>
                    <IconButton
                      size="small"
                      onClick={() => onRemove(index)}
                      sx={{
                        flexShrink: 0,
                        color: 'text.disabled',
                        borderRadius: '6px',
                        '&:hover': {color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)'},
                      }}
                    >
                      <CloseIcon sx={{fontSize: 14}} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
