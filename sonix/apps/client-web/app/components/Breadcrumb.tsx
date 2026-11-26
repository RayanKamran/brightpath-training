import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import {Link as RouterLink} from 'react-router';

type BreadcrumbItem = {
  /** Display label */
  label: string;
  /** Route path — if provided, renders as a link. If omitted, renders as text (current page). */
  to?: string;
  /** Optional icon to render before the label */
  icon?: React.ReactNode;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  /** Optional trailing element (e.g. a Chip with the ID) */
  trailing?: React.ReactNode;
};

const separatorSx = {fontSize: '0.875rem'} as const;
const linkSx = {fontSize: '0.875rem'} as const;
const activeSx = {fontSize: '0.875rem', fontWeight: 600} as const;

/**
 * Reusable breadcrumb navigation.
 * Last item (or item without `to`) renders as active text; others render as links.
 */
export function Breadcrumb({items, trailing}: BreadcrumbProps) {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isLink = !!item.to && !isLast;

        return (
          <Box key={item.label} sx={{display: 'contents'}}>
            {index > 0 && (
              <Typography color="text.secondary" sx={separatorSx}>
                {'›'}
              </Typography>
            )}
            {isLink && item.to ? (
              <Link
                component={RouterLink}
                to={item.to}
                underline="hover"
                color="text.secondary"
                sx={linkSx}
              >
                {item.label}
              </Link>
            ) : (
              <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                {item.icon}
                <Typography sx={isLast ? activeSx : linkSx}>{item.label}</Typography>
              </Box>
            )}
          </Box>
        );
      })}
      {trailing}
    </Box>
  );
}
