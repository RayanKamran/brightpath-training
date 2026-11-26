import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {Breadcrumb} from 'components/Breadcrumb';
import {HideAfterDelay} from 'components/HideAfterDelay';
import {UnsavedChangesDialog} from 'components/UnsavedChangesDialog';
import {useLocationChangePrompt} from 'core/hooks/useLocationChangePrompt';
import {useUnsavedChangesGuard} from 'core/hooks/useUnsavedChangesGuard';
import {AUTH_KERNEL_CONTEXT} from 'core/middleware/routerContext';
import {queryClient} from 'core/queries/queryClient';
import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  type ClientActionFunctionArgs,
  Navigation,
  useActionData,
  useNavigate,
  useNavigation,
} from 'react-router';
import {LocationForm} from './LocationForm';
import {locationQueries} from './queries/locationQueries';
import {LOCATION_QUERY_KEYS} from './queries/locationQueryKey';

// clientAction: handle form submission

export async function clientAction({request, context}: ClientActionFunctionArgs) {
  const authKernel = context.get(AUTH_KERNEL_CONTEXT);
  const token = await authKernel.getValidToken();

  const formData: FormData = await request.formData();
  const raw: FormDataEntryValue | null = formData.get('payload');
  if (typeof raw !== 'string') {
    return {success: false as const, error: 'Invalid form data'};
  }

  try {
    const payload = JSON.parse(raw);
    await locationQueries.create(payload, token ?? '');
    await queryClient.invalidateQueries({queryKey: LOCATION_QUERY_KEYS.all()});

    return {success: true as const};
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to create location',
    };
  }
}

// Component

export default function LocationCreate() {
  const navigate = useNavigate();
  const {t} = useTranslation('locations');
  const {t: tCommon} = useTranslation('common');

  const actionData = useActionData<typeof clientAction>();
  const navigation: Navigation = useNavigation();
  const isSubmitting: boolean = navigation.state === 'submitting';

  const [formDirty, setFormDirty] = useState(false);
  const handleDirtyChange = useCallback((dirty: boolean) => setFormDirty(dirty), []);
  const isDirty: boolean = formDirty && !actionData?.success && !isSubmitting;

  // Guard unsaved changes
  const {showDialog, confirm, cancel} = useUnsavedChangesGuard(isDirty);
  const locationPrompt = useLocationChangePrompt(isDirty, '/locations');

  // Redirect on success
  if (actionData?.success) {
    navigate('/locations');
  }

  return (
    <Box sx={{width: '100%'}}>
      <Breadcrumb
        items={[{label: t('title'), to: '/locations'}, {label: t('pageTitle.create')}]}
        trailing={
          <Button
            variant="contained"
            size="small"
            disabled={isSubmitting}
            onClick={() => document.getElementById('location-form-submit')?.click()}
            data-testid="location-submit-button"
            sx={{textTransform: 'none', boxShadow: 'none', '&:hover': {boxShadow: 'none'}}}
          >
            {isSubmitting ? t('saving') : t('pageTitle.create')}
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
            {t('createSuccess')}
          </Alert>
        </HideAfterDelay>
      )}

      <Box sx={{maxWidth: 600}}>
        <LocationForm
          mode="create"
          isSubmitting={isSubmitting}
          serverError={actionData && !actionData.success ? actionData.error : null}
          onDirtyChange={handleDirtyChange}
        />
      </Box>

      <UnsavedChangesDialog
        open={showDialog}
        message={t('unsavedChanges.createMessage')}
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
