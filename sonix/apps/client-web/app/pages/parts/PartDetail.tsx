import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import {Breadcrumb} from 'components/Breadcrumb';
import {QueryErrorAlert} from 'components/QueryErrorAlert';
import {formatCurrency} from 'core/formatters/formatCurrency';
import {formatNumber} from 'core/formatters/formatNumber';
import {RESOLVED_LOCATION_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {type ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {type ClientLoaderFunctionArgs, useNavigate, useParams} from 'react-router';
import {usePart} from './hooks/usePart';
import {partQueries} from './queries/partQueries';
import {PART_QUERY_KEYS} from './queries/partQueryKey';

export async function clientLoader({params, context}: ClientLoaderFunctionArgs) {
  const resolvedLocation = context.get(RESOLVED_LOCATION_CONTEXT);
  const partNumber = params.partNumber ?? '';

  if (!resolvedLocation || !partNumber) {
    return null;
  }

  const {locationToken} = resolvedLocation;

  await queryClient.ensureQueryData({
    queryKey: PART_QUERY_KEYS.detail(partNumber),
    queryFn: ({signal}) => partQueries.fetchById({id: partNumber, signal, token: locationToken}),
  });

  return null;
}

export default function PartDetail() {
  const {partNumber} = useParams<{partNumber: string}>();
  const {t, i18n} = useTranslation('parts');
  const navigate = useNavigate();
  const lang = i18n.language;

  const {data: part, isLoading, error} = usePart(partNumber ?? '');

  if (isLoading) {
    return (
      <Box sx={{p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !part) {
    return (
      <Box sx={{p: 3}}>
        <QueryErrorAlert error={error instanceof Error ? error : null} />
        {!error && <Alert severity="error">{t('partNotFound')}</Alert>}
        <Button variant="outlined" sx={{mt: 2}} onClick={() => navigate('/parts')}>
          {t('backToParts')}
        </Button>
      </Box>
    );
  }

  const listPriceAmount = part.listPrice ? part.listPrice.amount / 100 : null;
  const avgCostAmount = part.avgCost ? part.avgCost.amount / 100 : null;

  return (
    <Box sx={{width: '100%'}}>
      <Breadcrumb items={[{label: t('title'), to: '/parts'}, {label: part.partNumber}]} />

      <Box sx={{maxWidth: 900, mt: 2}}>
        {/* Identity */}
        <SectionHeader>{t('create.sections.partIdentity')}</SectionHeader>
        <FieldGrid>
          <Field label={t('create.fields.partId')} value={part.partNumber} />
          <Field label={t('create.fields.description')} value={part.description} />
          <Field
            label={t('create.fields.status')}
            value={<Chip label={part.status} size="small" />}
          />
          {part.comments && <Field label={t('create.fields.comments')} value={part.comments} />}
        </FieldGrid>

        <Divider sx={{my: 3}} />

        {/* Pricing & Units */}
        <SectionHeader>{`${t('create.sections.pricing')} & ${t('create.sections.unitOfMeasure')}`}</SectionHeader>
        <FieldGrid>
          <Field
            label={t('create.fields.listPrice')}
            value={formatCurrency(listPriceAmount, lang, 'USD', {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
          />
          <Field
            label={t('create.fields.avgCost')}
            value={formatCurrency(avgCostAmount, lang, 'USD', {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
          />
          <Field label={t('create.fields.sellingUom')} value={part.sellUom} />
          <Field label={t('create.fields.purchaseUom')} value={part.purchaseUom} />
          <Field label={t('create.fields.ratio')} value={part.salePurchaseRatio?.toString()} />
          <Field label={t('create.fields.priceGroup')} value={part.priceGroup} />
          <Field label={t('create.fields.glGroup')} value={part.glGroup} />
          <Field label={t('create.fields.taxCodes')} value={part.taxCode} />
        </FieldGrid>

        <Divider sx={{my: 3}} />

        {/* Inventory */}
        <SectionHeader>{t('create.sections.availability')}</SectionHeader>
        <FieldGrid>
          <Field
            label={t('edit.onHand')}
            value={formatNumber(part.totalOnHand, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.available')}
            value={formatNumber(part.totalAvailable, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.netAvailable')}
            value={formatNumber(part.totalNetAvailable, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.committed')}
            value={formatNumber(part.totalCommitted, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.onOrder')}
            value={formatNumber(part.totalOnOrder, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.backordered')}
            value={formatNumber(part.totalBackordered, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('edit.soCommitted')}
            value={formatNumber(part.totalSpecialOrderCommitted, lang, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          />
          <Field
            label={t('create.fields.lastReceived')}
            value={part.lastReceived ? new Date(part.lastReceived).toLocaleDateString(lang) : null}
          />
          <Field
            label={t('create.fields.lastSold')}
            value={part.lastSold ? new Date(part.lastSold).toLocaleDateString(lang) : null}
          />
        </FieldGrid>

        {/* Bins */}
        {part.bins.length > 0 && (
          <>
            <Divider sx={{my: 3}} />
            <SectionHeader>{t('create.fields.bins')}</SectionHeader>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
              {part.bins.map((bin) => (
                <Chip
                  key={bin.binNumber}
                  label={
                    bin.isMain
                      ? `${bin.binNumber} (${t('create.fields.primaryBin')})`
                      : bin.binNumber
                  }
                  variant={bin.isMain ? 'filled' : 'outlined'}
                  color={bin.isMain ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          </>
        )}

        {/* Vendors */}
        {part.vendors.length > 0 && (
          <>
            <Divider sx={{my: 3}} />
            <SectionHeader>{t('create.sections.vendors')}</SectionHeader>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, mt: 1}}>
              {part.vendors.map((vendor) => (
                <Box
                  key={vendor.vendorNumber}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 1fr 1fr',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: vendor.isPrimary ? 'primary.main' : 'divider',
                    bgcolor: vendor.isPrimary ? 'action.selected' : 'transparent',
                  }}
                >
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Typography variant="body2" sx={{fontWeight: 600}}>
                      {vendor.vendorNumber}
                    </Typography>
                    {vendor.isPrimary && (
                      <Chip
                        label={t('create.vendors.primary')}
                        size="small"
                        color="primary"
                        sx={{height: 18, fontSize: '0.65rem'}}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {vendor.vendorName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vendor.vendorPartNumber ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vendor.cost
                      ? formatCurrency(vendor.cost.amount / 100, lang, 'USD', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })
                      : '—'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        <Divider sx={{my: 3}} />

        {/* Restocking */}
        <SectionHeader>{t('create.sections.restocking')}</SectionHeader>
        <FieldGrid>
          <Field label={t('create.fields.minQty')} value={part.minQty?.toString()} />
          <Field label={t('create.fields.maxQty')} value={part.maxQty?.toString()} />
          <Field label={t('create.fields.minOrder')} value={part.minOrder?.toString()} />
          <Field label={t('create.fields.minDays')} value={part.minDays?.toString()} />
          <Field label={t('create.fields.caseQty')} value={part.caseQty?.toString()} />
        </FieldGrid>

        <Divider sx={{my: 3}} />

        {/* Shipping */}
        <SectionHeader>{t('create.sections.shipping')}</SectionHeader>
        <FieldGrid>
          <Field
            label={t('create.fields.shippingWeight')}
            value={part.shippingWeight?.toString()}
          />
          <Field label={t('create.fields.shippingUnit')} value={part.shippingUnit} />
        </FieldGrid>
      </Box>
    </Box>
  );
}

// --- Local sub-components ---

function SectionHeader({children}: {children: ReactNode}) {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

function FieldGrid({children}: {children: ReactNode}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'},
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function Field({label, value}: {label: string; value: ReactNode}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.25}}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{color: value ? 'text.primary' : 'text.disabled'}}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}
