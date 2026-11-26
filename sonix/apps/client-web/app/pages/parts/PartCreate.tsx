import {valibotResolver} from '@hookform/resolvers/valibot';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {Breadcrumb} from 'components/Breadcrumb';
import {HideAfterDelay} from 'components/HideAfterDelay';
import {UnsavedChangesDialog} from 'components/UnsavedChangesDialog';
import {ApiError} from 'core/config/apiErrors';
import {useLocationChangePrompt} from 'core/hooks/useLocationChangePrompt';
import {useUnsavedChangesGuard} from 'core/hooks/useUnsavedChangesGuard';
import {RESOLVED_LOCATION_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {type ReactNode, useEffect, useState} from 'react';
import {Controller, type FieldPath, useFieldArray, useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {
  type ClientActionFunctionArgs,
  useActionData,
  useNavigate,
  useNavigation,
  useSubmit,
} from 'react-router';
import {buildDefaultValues, transformToCreatePayload} from './mappers/partFormMapper';
import {partQueries} from './queries/partQueries';
import {PART_QUERY_KEYS} from './queries/partQueryKey';
import {type PartFormValues, partCreateSchema} from './schemas/partSchema';

const STATUSES = ['active', 'inactive', 'discontinued', 'retired'] as const;

// clientAction: POST /parts with the location token, report 400/404/409 back to the form

export async function clientAction({request, context}: ClientActionFunctionArgs) {
  const resolvedLocation = context.get(RESOLVED_LOCATION_CONTEXT);
  const raw = (await request.formData()).get('payload');
  if (!resolvedLocation || typeof raw !== 'string') {
    return {success: false as const, error: 'Location context is unavailable'};
  }
  try {
    const created = await partQueries.create(
      transformToCreatePayload(JSON.parse(raw) as PartFormValues, resolvedLocation.locationId),
      resolvedLocation.locationToken,
    );
    await queryClient.invalidateQueries({
      queryKey: PART_QUERY_KEYS.all(resolvedLocation.locationId),
    });
    return {success: true as const, partNumber: created.partNumber};
  } catch (err) {
    if (err instanceof ApiError) {
      const fieldErrors = (err.problem.errors ?? []).map((e) => `${e.field}: ${e.message}`);
      return {success: false as const, error: [err.message, ...fieldErrors].join('\n')};
    }
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to create part',
    };
  }
}

// Component

export default function PartCreate() {
  const {t} = useTranslation('parts');
  const {t: tCommon} = useTranslation('common');
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData<typeof clientAction>();
  const isSubmitting = useNavigation().state === 'submitting';

  const form = useForm<PartFormValues>({
    resolver: valibotResolver(partCreateSchema),
    defaultValues: buildDefaultValues(),
  });
  const {control, handleSubmit, formState, setValue, getValues} = form;
  const vendors = useFieldArray({control, name: 'vendors'});
  const [vendorDraft, setVendorDraft] = useState('');

  const isDirty = formState.isDirty && !actionData?.success && !isSubmitting;
  const guard = useUnsavedChangesGuard(isDirty);
  const locationPrompt = useLocationChangePrompt(isDirty, '/parts');

  // On success: banner, then the part's page (spec: Create-to-Edit navigation).
  useEffect(() => {
    if (actionData?.success) {
      navigate(`/parts/${encodeURIComponent(actionData.partNumber)}`, {replace: true});
    }
  }, [actionData, navigate]);

  const onSave = handleSubmit((values) =>
    submit(
      {payload: JSON.stringify(values)},
      {method: 'post', encType: 'application/x-www-form-urlencoded'},
    ),
  );

  const addVendor = () => {
    const vendorNumber = vendorDraft.trim();
    if (!vendorNumber) {
      return;
    }
    // The first vendor added is automatically the primary vendor.
    vendors.append({
      vendorNumber,
      vendorPartNumber: '',
      isPrimary: vendors.fields.length === 0,
      cost: '',
    });
    setVendorDraft('');
  };

  const makePrimary = (index: number) => {
    getValues('vendors').forEach((_, i) => {
      setValue(`vendors.${i}.isPrimary`, i === index, {shouldDirty: true});
    });
  };

  const removeVendor = (index: number) => {
    const wasPrimary = getValues(`vendors.${index}.isPrimary`);
    vendors.remove(index);
    if (wasPrimary && getValues('vendors').length > 0) {
      makePrimary(0);
    }
  };

  const field = (
    name: FieldPath<PartFormValues>,
    label: string,
    props: Record<string, unknown> = {},
  ) => (
    <Controller
      name={name}
      control={control}
      render={({field: f, fieldState}) => (
        <TextField
          {...f}
          value={f.value ?? ''}
          label={label}
          size="small"
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{'data-testid': `part-${name}`}}
          {...props}
        />
      )}
    />
  );
  const checkbox = (name: 'bypassPriceUpdate' | 'serialized', label: string) => (
    <Controller
      name={name}
      control={control}
      render={({field: f}) => (
        <FormControlLabel
          control={<Checkbox checked={f.value} onChange={(e) => f.onChange(e.target.checked)} />}
          label={label}
        />
      )}
    />
  );
  const section = (title: string, children: ReactNode) => (
    <Box sx={{mb: 3}}>
      <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 1.5}}>
        {title}
      </Typography>
      {children}
    </Box>
  );
  const row = (children: ReactNode) => (
    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{mb: 2}}>
      {children}
    </Stack>
  );

  return (
    <Box sx={{width: '100%'}}>
      <Breadcrumb
        items={[{label: t('title'), to: '/parts'}, {label: t('create.pageTitle')}]}
        trailing={
          <Button
            variant="contained"
            size="small"
            disabled={isSubmitting}
            onClick={onSave}
            data-testid="part-submit-button"
            sx={{textTransform: 'none', boxShadow: 'none'}}
          >
            {isSubmitting ? t('create.saving') : t('create.save')}
          </Button>
        }
      />

      {actionData?.success && (
        <HideAfterDelay delay={3000}>
          <Alert
            icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            severity="success"
            sx={{mb: 2}}
          >
            {t('create.success')}
          </Alert>
        </HideAfterDelay>
      )}
      {actionData && !actionData.success && (
        <Alert severity="error" sx={{mb: 2, whiteSpace: 'pre-line'}} data-testid="part-form-error">
          {actionData.error}
        </Alert>
      )}
      {Object.keys(formState.errors).length > 0 && (
        <Alert severity="warning" sx={{mb: 2}} data-testid="part-form-summary">
          {Object.values(formState.errors)
            .map((e) => (e && 'message' in e ? (e.message as string) : null))
            .filter(Boolean)
            .join(' · ') || 'Check the highlighted fields'}
        </Alert>
      )}

      <Box sx={{maxWidth: 900}}>
        {section(
          t('create.sections.maintenance'),
          row(
            <>
              {field('partNumber', t('create.fields.partNumber'), {required: true})}
              {field('description', t('create.fields.description'), {required: true})}
              {field('status', t('create.fields.status'), {
                select: true,
                children: STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                )),
              })}
            </>,
          ),
        )}
        {section(
          t('create.sections.availability'),
          <>
            <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>
              {t('create.availabilityNote')}
            </Typography>
            {row(
              <Box sx={{maxWidth: 240}}>{field('onHandQty', t('create.fields.onHandQty'))}</Box>,
            )}
          </>,
        )}
        {section(
          t('create.sections.pricing'),
          row(
            <>
              {field('listPrice', t('create.fields.listPrice'))}
              {field('priceGroup', t('create.fields.priceGroup'))}
              {field('glGroup', t('create.fields.glGroup'))}
              {field('taxCode', t('create.fields.taxCode'))}
            </>,
          ),
        )}
        {section(
          t('create.sections.uom'),
          row(
            <>
              {field('sellUom', t('create.fields.sellUom'))}
              {field('purchaseUom', t('create.fields.purchaseUom'))}
              {field('salePurchaseRatio', t('create.fields.salePurchaseRatio'))}
            </>,
          ),
        )}
        {section(
          t('create.sections.shipping'),
          <>
            {row(
              <>
                {field('shippingWeight', t('create.fields.shippingWeight'))}
                {field('shippingUnit', t('create.fields.shippingUnit'))}
                {field('caseQty', t('create.fields.caseQty'))}
              </>,
            )}
            {row(
              <>
                {field('minQty', t('create.fields.minQty'))}
                {field('maxQty', t('create.fields.maxQty'))}
                {field('minDays', t('create.fields.minDays'))}
                {field('minOrder', t('create.fields.minOrder'))}
              </>,
            )}
            {row(
              <>
                {field('pogNumber', t('create.fields.pogNumber'))}
                {field('popCode', t('create.fields.popCode'))}
              </>,
            )}
            {row(field('comments', t('create.fields.comments'), {multiline: true, minRows: 2}))}
            {checkbox('bypassPriceUpdate', t('create.fields.bypassPriceUpdate'))}
            {checkbox('serialized', t('create.fields.serialized'))}
          </>,
        )}

        <Divider sx={{mb: 2}} />
        {section(
          t('create.sections.vendors'),
          <>
            {vendors.fields.length === 0 && (
              <Typography
                variant="body2"
                color={formState.errors.vendors ? 'error' : 'text.secondary'}
                sx={{mb: 1.5}}
              >
                {t('create.noVendors')}
              </Typography>
            )}
            {vendors.fields.map((v, i) => (
              <Stack
                key={v.id}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{mb: 1.5}}
                data-testid={`vendor-row-${i}`}
              >
                <Controller
                  name={`vendors.${i}.isPrimary`}
                  control={control}
                  render={({field: f}) => (
                    <FormControlLabel
                      control={<Radio checked={f.value} onChange={() => makePrimary(i)} />}
                      label={t('create.fields.primary')}
                    />
                  )}
                />
                {field(`vendors.${i}.vendorNumber`, t('create.fields.vendorNumber'))}
                {field(`vendors.${i}.vendorPartNumber`, t('create.fields.vendorPartNumber'))}
                {field(`vendors.${i}.cost`, t('create.fields.cost'))}
                <IconButton aria-label={t('create.removeVendor')} onClick={() => removeVendor(i)}>
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                label={t('create.fields.vendorNumber')}
                value={vendorDraft}
                onChange={(e) => setVendorDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVendor();
                  }
                }}
                inputProps={{'data-testid': 'vendor-draft'}}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={addVendor}
                data-testid="vendor-add"
                sx={{textTransform: 'none'}}
              >
                {t('create.addVendor')}
              </Button>
            </Stack>
          </>,
        )}
      </Box>

      <UnsavedChangesDialog
        open={guard.showDialog}
        message={t('create.unsavedChanges')}
        onConfirm={guard.confirm}
        onCancel={guard.cancel}
      />
      <UnsavedChangesDialog
        open={locationPrompt.showDialog}
        message={tCommon('locationChangePrompt')}
        onConfirm={locationPrompt.confirm}
        onCancel={locationPrompt.cancel}
      />
    </Box>
  );
}
