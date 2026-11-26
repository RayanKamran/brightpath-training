import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {type GridColDef, type GridRenderCellParams} from '@mui/x-data-grid';
import type {TFunction} from 'i18next';
import type {DbLocation} from './types/location';

type LocationHandlers = {
  onDeactivate: (location: DbLocation, e: React.MouseEvent) => void;
  onActivate: (location: DbLocation, e: React.MouseEvent) => void;
};

export function getLocationListColumns(
  t: TFunction<'locations'>,
  {onDeactivate, onActivate}: LocationHandlers,
): GridColDef[] {
  return [
    {
      field: 'name',
      headerName: t('locationList.name'),
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<DbLocation>) => (
        <Typography sx={{fontSize: '0.8125rem', fontFamily: 'monospace', color: 'text.primary'}}>
          {params.value as string}
        </Typography>
      ),
    },
    {
      field: 'displayName',
      headerName: t('locationList.displayName'),
      flex: 1.5,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<DbLocation>) => (
        <Typography sx={{fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary'}}>
          {(params.value as string) || params.row.name}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: t('locationList.description'),
      flex: 2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<DbLocation>) => (
        <Tooltip
          title={(params.value as string) ?? ''}
          placement="top"
          enterDelay={400}
          slotProps={{tooltip: {sx: {bgcolor: '#47505F', color: 'white'}}}}
        >
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: params.value ? 'text.primary' : 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {(params.value as string) || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'active',
      headerName: t('locationList.active'),
      flex: 0.6,
      minWidth: 90,
      sortable: false,
      renderCell: (params: GridRenderCellParams<DbLocation>) => (
        <Chip
          label={params.value ? t('status.active') : t('status.inactive')}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('locationList.actions'),
      width: 80,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<DbLocation>) => {
        const location = params.row as DbLocation;
        return (
          <Box onClick={(e) => e.stopPropagation()}>
            {location.active ? (
              <Tooltip title={t('deactivate.button')}>
                <IconButton
                  size="small"
                  aria-label={`${t('deactivate.button')} ${location.displayName ?? location.name}`}
                  onClick={(e) => onDeactivate(location, e)}
                >
                  <ToggleOnIcon fontSize="small" sx={{color: 'primary.main'}} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t('activate.button')}>
                <IconButton
                  size="small"
                  aria-label={`${t('activate.button')} ${location.displayName ?? location.name}`}
                  onClick={(e) => onActivate(location, e)}
                >
                  <ToggleOffOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];
}
