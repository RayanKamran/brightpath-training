import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';

type UnsavedChangesDialogProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Generic confirmation dialog for unsaved changes.
 * Shows the message with Yes/No buttons — no title bar.
 * Reusable across any form page.
 */
export function UnsavedChangesDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{paper: {sx: {borderRadius: '12px'}}}}
    >
      <DialogContent sx={{pt: 3}}>
        <Typography sx={{fontSize: '0.875rem', color: 'text.secondary'}}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{px: 3, pb: 2, gap: 1}}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.8125rem',
            borderRadius: '8px',
          }}
        >
          No
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.8125rem',
            borderRadius: '8px',
            boxShadow: 'none',
            '&:hover': {boxShadow: 'none'},
          }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
