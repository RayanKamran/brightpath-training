import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {Breadcrumb} from 'components/Breadcrumb';
import {HideAfterDelay} from 'components/HideAfterDelay';
import {QueryErrorAlert} from 'components/QueryErrorAlert';
import {UnsavedChangesDialog} from 'components/UnsavedChangesDialog';
import {useLocationChangePrompt} from 'core/hooks/useLocationChangePrompt';
import {useUnsavedChangesGuard} from 'core/hooks/useUnsavedChangesGuard';
import {AUTH_KERNEL_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  type ClientActionFunctionArgs,
  type ClientLoaderFunctionArgs,
  Navigation,
  useActionData,
  useNavigation,
  useParams,
} from 'react-router';
import {useLocation} from './hooks/useLocation';
import {LocationForm} from './LocationForm';
import {locationQueries} from './queries/locationQueries';
import {LOCATION_QUERY_KEYS} from './queries/locationQueryKey';

// clientLoader: pre-fetch location detail

export async function clientLoader({params, context}: ClientLoaderFunctionArgs) {
  const authKernel = context.get(AUTH_KERNEL_CONTEXT);
  const token = await authKernel.getValidToken();
  const id: string = params.id ?? '';

  await queryClient.ensureQueryData({
    queryKey: LOCATION_QUERY_KEYS.detail(id),
    queryFn: ({signal}) => locationQueries.fetchById({id, signal, token: token ?? ''}),
  });

  return {id};
}

// clientAction: handle form update

export async function clientAction({request, params, context}: ClientActionFunctionArgs) {
  const authKernel = context.get(AUTH_KERNEL_CONTEXT);
  const token = await authKernel.getValidToken();
  const id: string = params.id ?? '';

  const formData: FormData = await request.formData();
  const raw: FormDataEntryValue | null = formData.get('payload');
  if (typeof raw !== 'string') {
    return {success: false as const, error: 'Invalid form data'};
  }

  try {
    const payload = JSON.parse(raw);

    await locationQueries.update(id, payload, token ?? '');
    await queryClient.invalidateQueries({queryKey: LOCATION_QUERY_KEYS.all()});
    await queryClient.invalidateQueries({queryKey: LOCATION_QUERY_KEYS.detail(id)});

    return {success: true as const};
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to update location',
    };
  }
}

// Component

export default function LocationDetail() {
  const {id} = useParams<{id: string}>();
  const {t} = useTranslation('locations');
  const {t: tCommon} = useTranslation('common');

  const {data: location, isLoading, error} = useLocation(id ?? '');

  const actionData = useActionData<typeof clientAction>();
  const navigation: Navigation = useNavigation();
  const isSubmitting: boolean = navigation.state === 'submitting';

  const [formDirty, setFormDirty] = useState(false);
  const handleDirtyChange = useCallback((dirty: boolean) => setFormDirty(dirty), []);
  const isDirty: boolean = formDirty && !actionData?.success && !isSubmitting;

  // Guard unsaved changes
  const {showDialog, confirm, cancel} = useUnsavedChangesGuard(isDirty);
  const locationPrompt = useLocationChangePrompt(isDirty, '/locations');

  // Loading
  if (isLoading) {
    return (
      <Box sx={{p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <CircularProgress data-testid="location-loading" />
      </Box>
    );
  }

  // Error
  if (error || !location) {
    return (
      <Box sx={{p: 3}}>
        <QueryErrorAlert error={error instanceof Error ? error : null} />
        {!error && (
          <Alert severity="error" data-testid="location-error">
            {t('locationNotFound')}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{width: '100%'}}>
      <Breadcrumb
        items={[
          {label: t('title'), to: '/locations'},
          {label: location.displayName ?? location.name},
        ]}
        trailing={
          <Button
            variant="contained"
            size="small"
            disabled={isSubmitting}
            onClick={() => document.getElementById('location-form-submit')?.click()}
            data-testid="location-submit-button"
            sx={{textTransform: 'none', boxShadow: 'none', '&:hover': {boxShadow: 'none'}}}
          >
            {isSubmitting ? t('saving') : t('pageTitle.save')}
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
            {t('updateSuccess')}
          </Alert>
        </HideAfterDelay>
      )}

      <Box sx={{maxWidth: 600}}>
        <LocationForm
          mode="edit"
          initialData={location}
          isSubmitting={isSubmitting}
          serverError={actionData && !actionData.success ? actionData.error : null}
          onDirtyChange={handleDirtyChange}
        />
      </Box>

      <UnsavedChangesDialog
        open={showDialog}
        message={t('unsavedChanges.editMessage')}
        onConfirm={confirm}
        onCancel={cancel}
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
