import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {DataGrid} from '@mui/x-data-grid';
import {useQuery} from '@tanstack/react-query';
import {QueryErrorAlert} from 'components/QueryErrorAlert';
import {isTransientError} from 'core/config/apiErrors';
import {useLocation} from 'core/contexts/location/useLocation';
import {useNetworkStatus} from 'core/hooks/useNetworkStatus';
import {RESOLVED_LOCATION_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {type ClientLoaderFunctionArgs, redirect, useNavigate, useSearchParams} from 'react-router';
import {getPartListColumns} from './columns';
import {partQueries} from './queries/partQueries';
import {PART_QUERY_KEYS} from './queries/partQueryKey';
import type {PartListResponse} from './types/part';

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

type LoaderData = {
  parts: PartListResponse | null;
};

export async function clientLoader({
  request,
  context,
}: ClientLoaderFunctionArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));
  const searchTerm = url.searchParams.get('search') ?? '';

  const resolvedLocation = context.get(RESOLVED_LOCATION_CONTEXT);

  if (!resolvedLocation) {
    return {parts: null};
  }

  const {locationId, locationToken} = resolvedLocation;

  let parts: PartListResponse | null = null;
  try {
    parts = await queryClient.ensureQueryData({
      queryKey: PART_QUERY_KEYS.list(locationId, {page, pageSize, searchTerm}),
      queryFn: ({signal}) =>
        partQueries.fetchAll({
          locationId,
          searchTerm,
          page,
          pageSize,
          signal,
          token: locationToken,
        }),
      revalidateIfStale: true,
    });
  } catch (error) {
    if (!isTransientError(error)) {
      throw error;
    }
    // When paginating, redirect back to page 1 so the user sees the cached first-page
    // data instead of an empty table. The NetworkAlert in the layout already shows the
    // connectivity banner — no additional inline error needed.
    if (page > 1) {
      const redirectUrl = new URL(request.url);
      redirectUrl.searchParams.delete('page');
      throw redirect(redirectUrl.pathname + redirectUrl.search);
    }
  }

  return {parts};
}

export default function PartsPage() {
  const {t: tParts} = useTranslation('parts');
  const {currentLocation, locationToken, refreshLocationToken} = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();

  // Re-compute column headers when language changes (tParts identity changes on language switch).
  const columns = useMemo(() => getPartListColumns(tParts), [tParts]);

  const locationId = currentLocation?.id ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Width measurement: Forces a synchronous reflow so MUI X DataGrid's ResizeObserver sees a
  // concrete pixel width instead of a percentage that collapses to 0 in a
  // deep flex chain before layout has resolved.
  const measureRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);

  useLayoutEffect(() => {
    const htmlDivElement: HTMLDivElement | null = measureRef.current;
    if (!htmlDivElement) {
      return;
    }

    const width: number = htmlDivElement.getBoundingClientRect().width;
    if (width > 0) {
      setGridWidth(Math.floor(width));
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const next: number = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (next > 0) {
        setGridWidth(next);
      }
    });
    resizeObserver.observe(htmlDivElement);
    return () => resizeObserver.disconnect();
  }, []);

  const {data, isFetching, error} = useQuery({
    queryKey: PART_QUERY_KEYS.list(locationId, {page, pageSize, searchTerm: search}),
    queryFn: ({signal}) => {
      return partQueries.fetchAll({
        locationId,
        searchTerm: search,
        page,
        pageSize,
        signal,
        token: locationToken ?? null,
        refreshToken: refreshLocationToken,
      });
    },
    enabled: !!locationId && !!locationToken && isOnline,
    placeholderData: (previousData) => previousData,
  });

  const parts = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  // Sync input field when URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Clean up pending debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  if (!locationId) {
    return (
      <Box sx={{p: 3}}>
        <Typography color="text.secondary">{tParts('locationContextUnavailable')}</Typography>
      </Box>
    );
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('search', value);
        } else {
          next.delete('search');
        }
        next.delete('page');
        return next;
      });
    }, 300);
  };

  return (
    <Box sx={{width: '100%'}}>
      <QueryErrorAlert error={error instanceof Error ? error : null} />
      <Typography
        variant="h5"
        component="h1"
        sx={{
          mb: 2,
          fontWeight: 600,
          fontSize: '1.25rem',
          letterSpacing: '-0.3px',
        }}
      >
        {tParts('title')}
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
            placeholder={tParts('search')}
            value={searchInput}
            onChange={handleSearchChange}
            aria-label="Search parts by part number, description, supplier part number, UPC, or alternate ID"
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
              htmlInput: {'data-testid': 'part-search-input'},
            }}
            sx={{flex: 1}}
          />
        </Box>

        {/* ── DataGrid ── */}
        <div ref={measureRef} style={{width: '100%'}} data-testid="parts-table-container">
          {gridWidth > 0 && (
            <div style={{width: gridWidth, height: GRID_HEIGHT}} data-testid="parts-table">
              <DataGrid
                columns={columns}
                columnHeaderHeight={44}
                data-testid="parts-pagination"
                disableRowSelectionOnClick
                getRowId={(row) => row.id ?? row.partNumber}
                onRowClick={(params) => navigate(`/parts/${params.row.partNumber}`)}
                loading={isFetching && parts.length === 0}
                onPaginationModelChange={(model) => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (model.pageSize !== pageSize) {
                      next.set('pageSize', String(model.pageSize));
                      next.delete('page');
                    } else {
                      // DataGrid is 0-indexed; URL is 1-indexed
                      next.set('page', String(model.page + 1));
                    }
                    return next;
                  });
                }}
                paginationMode="server"
                paginationModel={{page: page - 1, pageSize}} // DataGrid is 0-indexed; URL is 1-indexed
                pageSizeOptions={[10, 25, 50, 100]}
                rows={parts}
                rowHeight={ROW_HEIGHT}
                rowCount={Math.max(0, total)}
                slots={{
                  noRowsOverlay: () => <NoRowsOverlay label={tParts('noResults')} />,
                  loadingOverlay: LoadingOverlay,
                }}
                sx={dataGridSx}
              />
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
}

function NoRowsOverlay({label}: {label: string}) {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
      <Typography
        sx={{fontSize: '0.8125rem', color: 'text.secondary'}}
        data-testid="parts-no-results"
      >
        {label}
      </Typography>
    </Box>
  );
}

function LoadingOverlay() {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
      <CircularProgress data-testid="parts-loading" size={40} />
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
      bgcolor: 'action.selected',
      '&:hover': {bgcolor: 'action.hover'},
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
