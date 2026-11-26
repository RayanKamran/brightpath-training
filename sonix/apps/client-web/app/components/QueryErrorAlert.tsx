import {PROBLEM_URN_TYPE} from '@dms/data-models';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import {useTranslation} from 'react-i18next';
import {ApiError, isTransientError} from '../core/config/apiErrors';

type QueryErrorAlertProps = {
  error: Error | null;
};

export function QueryErrorAlert({error}: QueryErrorAlertProps) {
  const {t} = useTranslation('common');

  if (!error) {
    return null;
  }

  // Transient errors (network, server-down, timeout) are handled by NetworkAlert.
  if (isTransientError(error)) {
    return null;
  }

  if (error instanceof ApiError) {
    // Validation errors: show field-level detail list
    if (error.type === PROBLEM_URN_TYPE.VALIDATION && error.problem.errors?.length) {
      return (
        <Alert severity="warning">
          <AlertTitle>{error.problem.title}</AlertTitle>
          <List dense disablePadding>
            {error.problem.errors.map((e) => (
              <ListItem key={`${e.field}-${e.message}`} disableGutters disablePadding>
                <ListItemText primary={`${e.field}: ${e.message}`} />
              </ListItem>
            ))}
          </List>
        </Alert>
      );
    }

    // Other API errors: show detail or title
    return <Alert severity="error">{error.problem.detail ?? error.problem.title}</Alert>;
  }

  // Unknown errors: generic fallback
  return <Alert severity="error">{error.message || t('errors.unexpected')}</Alert>;
}
