import ConstructionIcon from '@mui/icons-material/Construction';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import {useTranslation} from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
  featureName: string;
};

export function ComingSoonDialog({open, onClose, featureName}: Props) {
  const {t} = useTranslation('common');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
        <ConstructionIcon color="warning" />
        {featureName}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t('comingSoon.description')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
