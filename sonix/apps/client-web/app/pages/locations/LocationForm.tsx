import {valibotResolver} from '@hookform/resolvers/valibot';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {useEffect} from 'react';
import {Controller, FormProvider, useFieldArray, useForm, useFormContext} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {SubmitFunction, useSubmit} from 'react-router';
import {
  buildDefaultValues,
  transformToCreatePayload,
  transformToUpdatePayload,
} from './mappers/locationFormMapper';
import {
  type LocationFormValues,
  locationCreateSchema,
  locationUpdateSchema,
} from './schemas/locationSchema';
import type {DbLocation, UpdateLocationInput} from './types/location';

type Props = {
  mode: 'create' | 'edit';
  initialData?: DbLocation | null;
  isSubmitting: boolean;
  serverError?: string | null;
  onDirtyChange?: (dirty: boolean) => void;
};

export function LocationForm({mode, initialData, isSubmitting, serverError, onDirtyChange}: Props) {
  const submit: SubmitFunction = useSubmit();
  const isEdit: boolean = mode === 'edit';

  const methods = useForm<LocationFormValues>({
    resolver: valibotResolver(isEdit ? locationUpdateSchema : locationCreateSchema),
    defaultValues: buildDefaultValues(initialData),
  });

  const {isDirty} = methods.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleFormSubmit = (data: LocationFormValues) => {
    const payload: UpdateLocationInput = isEdit
      ? transformToUpdatePayload(data)
      : transformToCreatePayload(data);
    submit(
      {payload: JSON.stringify(payload)},
      {method: 'post', encType: 'application/x-www-form-urlencoded'},
    );
  };

  return (
    <FormProvider {...methods}>
      {/* Hidden submit trigger — clicked by the page-level Save button */}
      <button
        id="location-form-submit"
        type="button"
        onClick={methods.handleSubmit(handleFormSubmit)}
        disabled={isSubmitting}
        style={{display: 'none'}}
      />

      {serverError && (
        <Alert severity="error" sx={{mb: 3}} data-testid="location-form-error">
          {serverError}
        </Alert>
      )}

      <Box
        sx={{
          opacity: isSubmitting ? 0.6 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto',
        }}
      >
        <Stack spacing={3}>
          <BasicFields nameReadOnly={isEdit} />
          <AddressSection />
          <ContactSection />
        </Stack>
      </Box>
    </FormProvider>
  );
}

// Basic Fields Section

function BasicFields({nameReadOnly}: {nameReadOnly: boolean}) {
  const {control} = useFormContext<LocationFormValues>();
  const {t} = useTranslation('locations');

  return (
    <>
      <Controller
        name="name"
        control={control}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            label={t('fields.name')}
            required={!nameReadOnly}
            disabled={nameReadOnly}
            helperText={
              fieldState.error?.message ?? (nameReadOnly ? t('fields.nameReadOnlyHint') : undefined)
            }
            error={!!fieldState.error}
            slotProps={{
              htmlInput: {
                'data-testid': nameReadOnly ? 'location-name-readonly' : 'location-name-input',
              },
            }}
            fullWidth
          />
        )}
      />

      <Controller
        name="displayName"
        control={control}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            label={t('fields.displayName')}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            slotProps={{htmlInput: {'data-testid': 'location-display-name-input'}}}
            fullWidth
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            label={t('fields.description')}
            multiline
            minRows={3}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            slotProps={{htmlInput: {'data-testid': 'location-description-input'}}}
            fullWidth
          />
        )}
      />

      <Controller
        name="active"
        control={control}
        render={({field}) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                data-testid="location-active-switch"
              />
            }
            label={t('fields.active')}
          />
        )}
      />
    </>
  );
}

// Address Section

function AddressSection() {
  const {control} = useFormContext<LocationFormValues>();
  const {t} = useTranslation('locations');
  const {fields, append, remove} = useFieldArray({control, name: 'addresses'});

  const handleAdd = () => {
    append({
      type: 'physical',
      isPrimary: false,
      addressLine1: '',
      addressLine2: '',
      locality: '',
      region: '',
      postalCode: '',
      country: 'US',
      countryName: '',
    });
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{mb: 2}}>
        {t('addresses.sectionTitle')}
      </Typography>
      <Divider sx={{mb: 2}} />
      <Stack spacing={3}>
        {fields.map((field, idx) => (
          <Box key={field.id} data-testid={`address-row-${idx}`}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr auto',
                gap: 1.5,
                alignItems: 'center',
                mb: 1.5,
              }}
            >
              <Controller
                name={`addresses.${idx}.type`}
                control={control}
                render={({field: f}) => (
                  <Select
                    value={f.value ?? 'physical'}
                    onChange={f.onChange}
                    size="small"
                    inputProps={{'data-testid': `address-type-${idx}`}}
                  >
                    <MenuItem value="physical">{t('addresses.typeOptions.physical')}</MenuItem>
                    <MenuItem value="mailing">{t('addresses.typeOptions.mailing')}</MenuItem>
                    <MenuItem value="billing">{t('addresses.typeOptions.billing')}</MenuItem>
                    <MenuItem value="shipping">{t('addresses.typeOptions.shipping')}</MenuItem>
                  </Select>
                )}
              />
              <Controller
                name={`addresses.${idx}.isPrimary`}
                control={control}
                render={({field: f}) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={f.value ?? false}
                        onChange={(e) => f.onChange(e.target.checked)}
                        size="small"
                        data-testid={`address-primary-${idx}`}
                      />
                    }
                    label={t('addresses.isPrimary')}
                  />
                )}
              />
              <IconButton
                size="small"
                aria-label={t('addresses.remove')}
                onClick={() => remove(idx)}
                data-testid={`address-remove-${idx}`}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={1.5}>
              <Controller
                name={`addresses.${idx}.addressLine1`}
                control={control}
                render={({field: f, fieldState}) => (
                  <TextField
                    {...f}
                    label={t('addresses.line1')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{htmlInput: {'data-testid': `address-line1-${idx}`}}}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={`addresses.${idx}.addressLine2`}
                control={control}
                render={({field: f}) => (
                  <TextField
                    {...f}
                    value={f.value ?? ''}
                    label={t('addresses.line2')}
                    slotProps={{htmlInput: {'data-testid': `address-line2-${idx}`}}}
                    fullWidth
                  />
                )}
              />
              <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                <Controller
                  name={`addresses.${idx}.locality`}
                  control={control}
                  render={({field: f, fieldState}) => (
                    <TextField
                      {...f}
                      label={t('addresses.city')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{htmlInput: {'data-testid': `address-city-${idx}`}}}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name={`addresses.${idx}.region`}
                  control={control}
                  render={({field: f}) => (
                    <TextField
                      {...f}
                      value={f.value ?? ''}
                      label={t('addresses.state')}
                      slotProps={{htmlInput: {'data-testid': `address-state-${idx}`}}}
                      fullWidth
                    />
                  )}
                />
              </Box>
              <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                <Controller
                  name={`addresses.${idx}.postalCode`}
                  control={control}
                  render={({field: f}) => (
                    <TextField
                      {...f}
                      value={f.value ?? ''}
                      label={t('addresses.postalCode')}
                      slotProps={{htmlInput: {'data-testid': `address-postal-${idx}`}}}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name={`addresses.${idx}.country`}
                  control={control}
                  render={({field: f, fieldState}) => (
                    <TextField
                      {...f}
                      label={t('addresses.country')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{htmlInput: {'data-testid': `address-country-${idx}`}}}
                      fullWidth
                    />
                  )}
                />
              </Box>
            </Stack>
            {idx < fields.length - 1 && <Divider sx={{mt: 2}} />}
          </Box>
        ))}
        <Box>
          <Button variant="text" size="small" onClick={handleAdd} data-testid="add-address-button">
            + {t('addresses.add')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// Contact Section

function ContactSection() {
  const {control} = useFormContext<LocationFormValues>();
  const {t} = useTranslation('locations');
  const {fields, append, remove} = useFieldArray({control, name: 'contacts'});

  const handleAdd = () => {
    append({type: 'phone', label: '', value: ''});
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{mb: 2}}>
        {t('contacts.sectionTitle')}
      </Typography>
      <Divider sx={{mb: 2}} />
      <Stack spacing={1.5}>
        {fields.map((field, idx) => (
          <Box
            key={field.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 1fr auto',
              gap: 1.5,
              alignItems: 'center',
            }}
            data-testid={`contact-row-${idx}`}
          >
            <Controller
              name={`contacts.${idx}.type`}
              control={control}
              render={({field: f}) => (
                <Select
                  value={f.value}
                  onChange={f.onChange}
                  size="small"
                  inputProps={{'data-testid': `contact-type-${idx}`}}
                >
                  <MenuItem value="phone">{t('contacts.typeOptions.phone')}</MenuItem>
                  <MenuItem value="email">{t('contacts.typeOptions.email')}</MenuItem>
                  <MenuItem value="web">{t('contacts.typeOptions.web')}</MenuItem>
                </Select>
              )}
            />
            <Controller
              name={`contacts.${idx}.label`}
              control={control}
              render={({field: f}) => (
                <TextField
                  {...f}
                  value={f.value ?? ''}
                  placeholder={t('contacts.label')}
                  size="small"
                  slotProps={{htmlInput: {'data-testid': `contact-label-${idx}`}}}
                  fullWidth
                />
              )}
            />
            <Controller
              name={`contacts.${idx}.value`}
              control={control}
              render={({field: f, fieldState}) => (
                <TextField
                  {...f}
                  placeholder={t('contacts.value')}
                  size="small"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  slotProps={{htmlInput: {'data-testid': `contact-value-${idx}`}}}
                  fullWidth
                />
              )}
            />
            <IconButton
              size="small"
              aria-label={t('contacts.remove')}
              onClick={() => remove(idx)}
              data-testid={`contact-remove-${idx}`}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box>
          <Button variant="text" size="small" onClick={handleAdd} data-testid="add-contact-button">
            + {t('contacts.add')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
