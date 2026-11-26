import ConstructionIcon from '@mui/icons-material/Construction';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useTranslation} from 'react-i18next';

export function ComingSoon() {
  const {t} = useTranslation('common');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <ConstructionIcon sx={{fontSize: 64, color: 'text.secondary', mb: 2}} />
      <Typography variant="h5">{t('comingSoon.title')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
        {t('comingSoon.description')}
      </Typography>
    </Box>
  );
}
