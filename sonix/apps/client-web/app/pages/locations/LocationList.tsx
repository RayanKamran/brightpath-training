import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {DataGrid} from '@mui/x-data-grid';
import {useMutation, useQuery} from '@tanstack/react-query';
import {QueryErrorAlert} from 'components/QueryErrorAlert';
import {useAuth} from 'core/contexts/auth/useAuth';
import {AUTH_KERNEL_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {type ClientLoaderFunctionArgs, useNavigate} from 'react-router';
import {getLocationListColumns} from './columns';
import {DeactivateDialog} from './components/DeactivateDialog';
import {locationQueries} from './queries/locationQueries';
import {LOCATION_QUERY_KEYS} from './queries/locationQueryKey';
import type {DbLocation} from './types/location';

// ── clientLoader: pre-fetch initial list ──────────────────────────────────

export async function clientLoader({context}: ClientLoaderFunctionArgs) {
  const authKernel = context.get(AUTH_KERNEL_CONTEXT);
  const token = await authKernel.getValidToken();

  await queryClient.ensureQueryData({
    queryKey: LOCATION_QUERY_KEYS.list({page: 1, pageSize: 10, searchTerm: '', active: true}),
    queryFn: ({signal}) =>
      locationQueries.fetchAll({page: 1, pageSize: 10, active: true, signal, token: token ?? ''}),
  });

  return null;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 44;
const FOOTER_HEIGHT = 52;
const DEFAULT_PAGE_SIZE = 10;

// Fixed grid height shows exactly DEFAULT_PAGE_SIZE rows; internal scroller handles larger page sizes.
// ROW_BORDER_PX accounts for the 1px bottom border on each row to prevent a hairline scroll.
const ROW_BORDER_PX = 0.1;
const GRID_HEIGHT =
  ROW_HEIGHT * DEFAULT_PAGE_SIZE +
  ROW_BORDER_PX * DEFAULT_PAGE_SIZE +
  HEADER_HEIGHT +
  FOOTER_HEIGHT;

export default function LocationList() {
  const navigate = useNavigate();
  const {accessToken} = useAuth();
  const {t} = useTranslation('locations');

  // UI state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [deactivateTarget, setDeactivateTarget] = useState<DbLocation | null>(null);
  const [activateTarget, setActivateTarget] = useState<DbLocation | null>(null);

  // Width measurement
  const measureRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) {
      return;
    }
    const width = el.getBoundingClientRect().width;
    if (width > 0) {
      setGridWidth(Math.floor(width));
    }
    const ro = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (next > 0) {
        setGridWidth(next);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Columns
  const columns = useMemo(
    () =>
      getLocationListColumns(t, {
        onDeactivate: (location, e) => {
          e.stopPropagation();
          setDeactivateTarget(location);
        },
        onActivate: (location, e) => {
          e.stopPropagation();
          setActivateTarget(location);
        },
      }),
    [t],
  );

  // Data
  const activeParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const {data, isFetching, error} = useQuery({
    queryKey: LOCATION_QUERY_KEYS.list({page, pageSize, searchTerm: search, active: activeParam}),
    queryFn: ({signal}) =>
      locationQueries.fetchAll({
        page: page + 1, // API is 1-indexed; DataGrid is 0-indexed
        pageSize,
        searchTerm: search || undefined,
        active: activeParam,
        signal,
        token: accessToken ?? '',
      }),
    enabled: !!accessToken,
    placeholderData: (previousData) => previousData,
  });

  const locations = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  // Mutations
  const deactivateMutation = useMutation({
    mutationFn: (locationName: string) =>
      locationQueries.deactivate({id: locationName, token: accessToken ?? ''}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: LOCATION_QUERY_KEYS.all()}),
  });

  const activateMutation = useMutation({
    mutationFn: (locationName: string) =>
      locationQueries.activate({id: locationName, token: accessToken ?? ''}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: LOCATION_QUERY_KEYS.all()}),
  });

  // Handlers
  function handleDeactivateConfirm() {
    if (!deactivateTarget) {
      return;
    }
    const targetName = deactivateTarget.name;
    setDeactivateTarget(null);
    deactivateMutation.mutate(targetName);
  }

  function handleActivateConfirm() {
    if (!activateTarget) {
      return;
    }
    const targetName = activateTarget.name;
    setActivateTarget(null);
    activateMutation.mutate(targetName);
  }

  // Render
  return (
    <Box sx={{width: '100%'}}>
      <QueryErrorAlert error={error instanceof Error ? error : null} />
      <Typography
        variant="h5"
        component="h1"
        sx={{mb: 2, fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.3px'}}
      >
        {t('title')}
      </Typography>

      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* ── Toolbar ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TextField
            size="small"
            placeholder={t('search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            aria-label="Search locations"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{fontSize: 16, color: 'text.secondary'}}
                      data-testid="search-icon"
                    />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '0.8rem',
                  height: 36,
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {borderColor: 'divider'},
                },
              },
              htmlInput: {'data-testid': 'location-search-input'},
            }}
            sx={{flex: 1}}
          />
          <ToggleButtonGroup
            value={activeFilter}
            exclusive
            onChange={(_, value: 'active' | 'inactive' | 'all') => {
              if (value !== null) {
                setActiveFilter(value);
                setPage(0);
              }
            }}
            size="small"
            aria-label="Filter by status"
            data-testid="location-filter"
            sx={{
              '& .MuiToggleButton-root': {
                height: 36,
                px: 1.5,
                fontSize: '0.8125rem',
                textTransform: 'none',
              },
            }}
          >
            <ToggleButton value="active" data-testid="filter-active">
              {t('filter.active')}
            </ToggleButton>
            <ToggleButton value="inactive" data-testid="filter-inactive">
              {t('filter.inactive')}
            </ToggleButton>
            <ToggleButton value="all" data-testid="filter-all">
              {t('filter.all')}
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate('/locations/create')}
            sx={{
              height: 36,
              px: 2,
              borderRadius: '8px',
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {boxShadow: 'none'},
              '&:active': {boxShadow: 'none'},
            }}
            data-testid="create-location-button"
          >
            {t('createLocation')}
          </Button>
        </Box>

        {/* ── DataGrid ── */}
        <div ref={measureRef} style={{width: '100%'}} data-testid="locations-table-container">
          {gridWidth > 0 && (
            <div style={{width: gridWidth, height: GRID_HEIGHT}} data-testid="locations-table">
              <DataGrid
                columns={columns}
                columnHeaderHeight={44}
                data-testid="locations-pagination"
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                onRowClick={(params) => navigate(`/locations/${params.row.name}`)}
                loading={isFetching && locations.length === 0}
                onPaginationModelChange={(model) => {
                  if (model.pageSize !== pageSize) {
                    setPageSize(model.pageSize);
                    setPage(0);
                  } else {
                    setPage(model.page);
                  }
                }}
                paginationMode="server"
                paginationModel={{page, pageSize}}
                pageSizeOptions={[10, 25, 50, 100]}
                rows={locations}
                rowHeight={ROW_HEIGHT}
                rowCount={Math.max(0, total)}
                slots={{
                  noRowsOverlay: () => <NoRowsOverlay label={t('noResults')} />,
                  loadingOverlay: LoadingOverlay,
                }}
                sx={dataGridSx}
              />
            </div>
          )}
        </div>
      </Box>

      <DeactivateDialog
        open={deactivateTarget !== null}
        locationName={
          deactivateTarget ? (deactivateTarget.displayName ?? deactivateTarget.name) : ''
        }
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
      />
      <DeactivateDialog
        mode="activate"
        open={activateTarget !== null}
        locationName={activateTarget ? (activateTarget.displayName ?? activateTarget.name) : ''}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleActivateConfirm}
      />
    </Box>
  );
}

function NoRowsOverlay({label}: {label: string}) {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
      <Typography
        sx={{fontSize: '0.8125rem', color: 'text.secondary'}}
        data-testid="locations-no-results"
      >
        {label}
      </Typography>
    </Box>
  );
}

function LoadingOverlay() {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
      <CircularProgress data-testid="locations-loading" size={40} />
    </Box>
  );
}

const dataGridSx = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'background.default',
    borderColor: 'divider',
    minHeight: '44px !important',
    maxHeight: '44px !important',
    lineHeight: '44px',
  },
  '& .MuiDataGrid-columnHeader': {
    bgcolor: 'background.default',
    borderBottom: 'none !important',
    '&:focus, &:focus-within': {outline: 'none'},
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'text.secondary',
    textTransform: 'capitalize',
    letterSpacing: '0.04em',
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    '&:hover': {bgcolor: 'action.hover'},
    '&.Mui-selected': {
      bgcolor: 'rgba(21,101,192,0.1)',
      '&:hover': {bgcolor: 'rgba(21,101,192,0.16)'},
    },
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid',
    borderColor: 'divider',
    '&:focus, &:focus-within': {outline: 'none'},
    '&:focus-visible, &:has(:focus-visible)': {
      outline: '1px solid',
      outlineColor: 'primary.main',
      outlineOffset: '-1px',
    },
    display: 'flex',
    alignItems: 'center',
    py: 0,
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid',
    borderColor: 'divider',
    minHeight: 52,
  },
  '& .MuiCheckbox-root': {
    color: 'text.disabled',
    '&.Mui-checked': {color: 'primary.main'},
  },
  '& .MuiDataGrid-virtualScroller': {
    bgcolor: 'background.paper',
  },
  // Thin scrollbars on the main scrollable content only
  '& .MuiDataGrid-scrollbar': {
    '&::-webkit-scrollbar': {width: 6, height: 6},
    '&::-webkit-scrollbar-thumb': {bgcolor: 'text.disabled', borderRadius: 3},
    '&::-webkit-scrollbar-track': {bgcolor: 'transparent'},
    scrollbarWidth: 'thin',
  },
  '& .MuiTablePagination-root': {fontSize: '0.8rem'},
  '& .MuiDataGrid-scrollbarFiller': {
    bgcolor: 'background.paper !important',
    borderTop: 'none !important',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontWeight: 400,
  },
  '& .MuiDataGrid-columnSeparator': {
    color: 'divider',
  },
} as const;
