import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';

export default function NotFound() {
  const {t} = useTranslation('common');
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h1"
        color="text.disabled"
        sx={{fontSize: '8rem', fontWeight: 700, lineHeight: 1}}
      >
        404
      </Typography>
      <Typography variant="h5" color="text.primary">
        {t('notFound.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t('notFound.description')}
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{mt: 2}}>
        {t('notFound.backHome')}
      </Button>
    </Box>
  );
}
