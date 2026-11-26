import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {useTranslation} from 'react-i18next';

interface DeactivateDialogProps {
  open: boolean;
  locationName: string;
  mode?: 'deactivate' | 'activate';
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateDialog({
  open,
  locationName,
  mode = 'deactivate',
  onClose,
  onConfirm,
}: DeactivateDialogProps) {
  const {t} = useTranslation('locations');
  const ns = mode === 'activate' ? 'activate' : 'deactivate';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth data-testid="deactivate-dialog">
      <DialogTitle data-testid="deactivate-dialog-title">{t(`${ns}.confirmTitle`)}</DialogTitle>

      <DialogContent>
        <DialogContentText data-testid="deactivate-dialog-message">
          {t(`${ns}.confirmMessage`, {name: locationName})}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={onClose} data-testid="deactivate-cancel-button">
          {t(`${ns}.cancel`)}
        </Button>
        <Button
          variant="contained"
          color={mode === 'activate' ? 'primary' : 'error'}
          onClick={onConfirm}
          data-testid="deactivate-confirm-button"
        >
          {t(`${ns}.confirm`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
