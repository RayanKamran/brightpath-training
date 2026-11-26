import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {type GridColDef, type GridRenderCellParams} from '@mui/x-data-grid';
import {formatCurrency} from 'core/formatters/formatCurrency';
import {formatNumber} from 'core/formatters/formatNumber';
import type {TFunction} from 'i18next';
import {Link} from 'react-router';
import i18n from '../../i18n';
import type {Part} from './types/part';

export function getPartListColumns(t: TFunction<'parts'>): GridColDef[] {
  return [
    {
      field: 'partNumber',
      headerName: t('partList.partNumber'),
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <MuiLink
          component={Link}
          to={`/parts/${params.row.partNumber}`}
          underline="hover"
          sx={{fontSize: '0.8125rem', fontWeight: 600, color: 'primary.main'}}
        >
          {params.value as string}
        </MuiLink>
      ),
    },
    {
      field: 'primaryVendorPartNumber',
      headerName: t('partList.vendorPartNumber'),
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography
          sx={{fontSize: '0.8125rem', color: params.value ? 'text.primary' : 'text.secondary'}}
        >
          {(params.value as string) || '-'}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: t('partList.description'),
      flex: 2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Tooltip
          title={(params.value as string) ?? ''}
          placement="top"
          enterDelay={400}
          slotProps={{tooltip: {sx: {bgcolor: '#47505F', color: 'white'}}}}
        >
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {params.value as string}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'totalOnHand',
      headerName: t('partList.onHandQty'),
      flex: 0.7,
      minWidth: 90,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography sx={{fontSize: '0.8125rem', color: 'text.primary'}}>
          {formatNumber(params.value as number | null | undefined, i18n.language, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </Typography>
      ),
    },
    {
      field: 'sellUom',
      headerName: t('partList.sellUom'),
      flex: 0.5,
      minWidth: 70,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography
          sx={{fontSize: '0.8125rem', color: params.value ? 'text.primary' : 'text.secondary'}}
        >
          {(params.value as string) || '-'}
        </Typography>
      ),
    },
    {
      field: 'listPrice',
      headerName: t('partList.listPrice'),
      flex: 0.8,
      minWidth: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value: unknown, row: Part) =>
        row.listPrice ? row.listPrice.amount / 100 : null,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography sx={{fontSize: '0.8125rem', color: 'text.primary'}}>
          {formatCurrency(params.value as number | null | undefined, i18n.language, 'USD', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}
        </Typography>
      ),
    },
    {
      field: 'primaryVendorName',
      headerName: t('partList.mainVendor'),
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography
          sx={{fontSize: '0.8125rem', color: params.value ? 'text.primary' : 'text.secondary'}}
        >
          {(params.value as string) || '-'}
        </Typography>
      ),
    },
    {
      field: 'primaryBinNumber',
      headerName: t('partList.mainBin'),
      flex: 0.6,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<Part>) => (
        <Typography
          sx={{fontSize: '0.8125rem', color: params.value ? 'text.primary' : 'text.secondary'}}
        >
          {(params.value as string) || '-'}
        </Typography>
      ),
    },
  ];
}
