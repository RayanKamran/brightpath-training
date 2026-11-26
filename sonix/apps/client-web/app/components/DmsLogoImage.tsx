import {Box} from '@mui/material';

interface DmsLogoImageProps {
  width?: number | string;
  height?: number | string;
  /* Additional styles to apply. For example, to force the logo to be all white: {filter: 'brightness(0) invert(1)' } */
  sxExtras?: object;
}

export function DmsLogoImage({width = 200, height = 'auto', sxExtras}: DmsLogoImageProps) {
  return (
    <Box
      component="img"
      src="/dms-logo-2025.svg"
      alt="DMS Logo"
      sx={{
        width,
        height,
        display: 'block',
        ...sxExtras,
      }}
    />
  );
}
