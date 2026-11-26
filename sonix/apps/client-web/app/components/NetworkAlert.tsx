import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import {useTranslation} from 'react-i18next';
import {useNetworkStatusDetailed} from '../core/hooks/useNetworkStatus';
import {HideAfterDelay} from './HideAfterDelay';

export function NetworkAlert() {
  const {t} = useTranslation('common');
  const {status, lastStatus} = useNetworkStatusDetailed();

  const showNoNetwork = status === 'noNetwork';
  const showNoServer = status === 'noServerAccess';
  const showReconnected =
    status === 'connected' && (lastStatus === 'noNetwork' || lastStatus === 'noServerAccess');

  if (!showNoNetwork && !showNoServer && !showReconnected) {
    return null;
  }

  return (
    <Box sx={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1400}}>
      <Collapse in={showNoNetwork}>
        <Alert severity="warning" sx={{borderRadius: 0}}>
          {t('offline.noNetwork')}
        </Alert>
      </Collapse>

      <Collapse in={showNoServer}>
        <Alert severity="error" sx={{borderRadius: 0}}>
          {t('offline.serverUnavailable')}
        </Alert>
      </Collapse>

      {showReconnected && (
        <HideAfterDelay delay={2000}>
          <Alert severity="success" sx={{borderRadius: 0}}>
            {t('offline.restored')}
          </Alert>
        </HideAfterDelay>
      )}
    </Box>
  );
}
