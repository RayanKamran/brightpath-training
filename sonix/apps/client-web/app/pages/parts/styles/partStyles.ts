import type {SxProps, Theme} from '@mui/material/styles';

export const fieldSx = {
  '& .MuiInputBase-root': {fontSize: '0.875rem'},
  '& .MuiInputLabel-root': {fontSize: '0.875rem'},
} as const satisfies SxProps<Theme>;

export const cardSx = {
  p: 2,
  borderRadius: 2,
} as const satisfies SxProps<Theme>;
