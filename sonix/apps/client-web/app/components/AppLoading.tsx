import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import i18n from '../i18n';
import {AnimatedDots} from './AnimatedDots';
import {Logo} from './Logo';

type AppLoadingProps = {
  message?: string;
};

export function AppLoading({message}: AppLoadingProps) {
  const displayMessage = message ?? i18n.t('loadingApp', {appName: i18n.t('appName')});

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '100px',
        gap: 2,
      }}
    >
      <Logo width={80} animated />
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
        <Typography variant="body2" color="text.secondary" style={{marginBottom: '4px'}}>
          {displayMessage}
        </Typography>
        <AnimatedDots />
      </Box>
    </Box>
  );
}
