import BusinessIcon from '@mui/icons-material/Business';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {useLocationChangeGuard} from 'core/contexts/location/LocationChangeGuardContext';
import {useLocation} from 'core/contexts/location/useLocation';
import {t} from 'i18next';
import {useState} from 'react';

export function LocationSwitcher() {
  const {locations, currentLocation, isLoading, switchLocation} = useLocation();
  const {requestSwitch} = useLocationChangeGuard();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [switching, setSwitching] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (locations.length > 1) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitch = async (logtoId: string) => {
    const location = locations.find((loc) => loc.logtoId === logtoId);
    if (!location || location.logtoId === currentLocation?.logtoId) {
      handleClose();
      return;
    }

    // Check if a form page has registered a guard
    const canProceed = requestSwitch(logtoId);
    if (!canProceed) {
      handleClose();
      return;
    }

    try {
      setSwitching(true);
      await switchLocation(logtoId);
      handleClose();
    } catch (error) {
      console.error('Failed to switch location:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (isLoading || !currentLocation) {
    // If not loading but still no location, user might not have any location assignments
    if (!isLoading && locations.length === 0) {
      return (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <BusinessIcon sx={{fontSize: 20, color: 'text.disabled'}} />
          <Typography variant="caption" sx={{color: 'inherit', opacity: 0.5}}>
            {t('locationSwitcher:noLocationAssigned')}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CircularProgress size={16} />
        <Typography variant="caption" sx={{color: 'inherit', opacity: 0.85}}>
          {t('locationSwitcher:loadingLocation')}
        </Typography>
      </Box>
    );
  }

  const hasMultipleLocations = locations.length > 1;

  return (
    <>
      <Box
        onClick={handleClick}
        data-testid="location-switcher-button"
        sx={{
          px: 2,
          py: 1.5,
          cursor: hasMultipleLocations ? 'pointer' : 'default',
          '&:hover': hasMultipleLocations
            ? {
                backgroundColor: 'action.hover',
              }
            : undefined,
          borderRadius: 1,
          transition: 'background-color 0.2s',
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
          <BusinessIcon sx={{fontSize: 20, color: 'inherit', opacity: 0.85}} />
          <Box sx={{flexGrow: 1, minWidth: 0}}>
            <Typography
              variant="caption"
              sx={{color: 'inherit', opacity: 0.85, display: 'block', lineHeight: 1.2}}
            >
              {t('locationSwitcher:currentLocation')}
            </Typography>
            <Typography
              variant="body2"
              data-testid="current-location-name"
              sx={{
                fontWeight: 500,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentLocation.displayName || currentLocation.name}
            </Typography>
          </Box>
          {hasMultipleLocations && (
            <ExpandMoreIcon sx={{fontSize: 20, color: 'inherit', opacity: 0.85}} />
          )}
        </Box>
      </Box>

      {hasMultipleLocations && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              minWidth: 220,
              maxWidth: 300,
            },
          }}
        >
          <MenuItem disabled>
            <ListItemText
              primary="Switch Location"
              primaryTypographyProps={{
                variant: 'caption',
                color: 'text.secondary',
              }}
            />
          </MenuItem>
          {locations.map((loc) => (
            <MenuItem
              key={loc.id}
              onClick={() => loc.logtoId && handleSwitch(loc.logtoId)}
              selected={loc.logtoId === currentLocation?.logtoId}
              disabled={switching || !loc.logtoId}
              data-testid={`location-menu-item-${loc.id}`}
            >
              <ListItemIcon>
                <BusinessIcon
                  fontSize="small"
                  color={currentLocation.name === loc.name ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText
                primary={loc.displayName || loc.name}
                secondary={loc.name !== (loc.displayName || loc.name) ? loc.name : loc.description}
                primaryTypographyProps={{
                  sx: {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
              {switching && loc.logtoId !== currentLocation?.logtoId && (
                <CircularProgress size={16} sx={{ml: 1}} />
              )}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
