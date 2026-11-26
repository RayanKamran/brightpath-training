import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {useTranslation} from 'react-i18next';
import {isRouteErrorResponse, useNavigate, useRouteError} from 'react-router';

export function ErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();
  const {t} = useTranslation('common');

  const message = isRouteErrorResponse(error)
    ? (error.data?.message ?? error.statusText)
    : error instanceof Error
      ? error.message
      : t('errors.unexpected');

  return (
    <Box sx={{p: 3}}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => navigate(-1)}>
            {t('back')}
          </Button>
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
