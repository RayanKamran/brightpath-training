import {useLogto} from '@logto/react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type {TFunction} from 'i18next';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import {useAuth} from '../core/contexts/auth/useAuth';
import {
  clearAuthRedirectTarget,
  getAuthRedirectTarget,
  saveAuthRedirectTarget,
} from '../core/storage/authRedirectSessionStore';
import {
  clearSignOutNotice,
  getSignOutNotice,
  type SignOutNoticeKind,
} from '../core/storage/sessionStore';

function getSignOutNoticeMessage(
  notice: SignOutNoticeKind | null,
  t: TFunction<'common'>,
): string | null {
  if (notice === null) {
    return null;
  }
  if (notice === 'session_expired') {
    return t('auth.errors.sessionExpired');
  }
  if (notice === 'session_invalid') {
    return t('auth.errors.sessionInvalid');
  }
  if (notice === 'tenant_access_lost') {
    return t('auth.errors.tenantAccessLost');
  }
  if (notice === 'no_locations_assigned') {
    return t('auth.errors.noLocationsAssigned');
  }
  return t('auth.errors.authError');
}

export default function SignIn() {
  const {t} = useTranslation('common');
  const {signIn, isAuthenticated, isLoading, error: authError, status, retryAuth} = useAuth();
  const {error: logtoError} = useLogto();
  const navigate = useNavigate();
  const isServerUnavailable = status === 'error' && authError === 'server_unavailable';

  const [signInError, setSignInError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [signOutNotice] = useState<SignOutNoticeKind | null>(() => {
    const notice = getSignOutNotice();
    if (notice) {
      clearSignOutNotice();
    }
    return notice;
  });

  // Show friendly message when Logto reports an error (e.g. auth service unreachable).
  // Only react after the user has attempted sign-in to avoid showing stale errors on mount.
  useEffect(() => {
    if (hasAttempted && logtoError) {
      setSignInError(t('auth.errors.serviceUnavailable'));
      setIsSigningIn(false);
    }
  }, [logtoError, hasAttempted, t]);

  // When retrying and auth resolves successfully, do a hard navigation
  // so the middleware re-runs and sets RESOLVED_LOCATION_CONTEXT.
  useEffect(() => {
    if (isRetrying && isAuthenticated && !isServerUnavailable) {
      const redirectTo = getAuthRedirectTarget() ?? '/';
      clearAuthRedirectTarget();
      setIsRetrying(false);
      window.location.replace(redirectTo);
    }

    if (isRetrying && isServerUnavailable) {
      // Retry failed — server still down
      setIsRetrying(false);
    }
  }, [isRetrying, isAuthenticated, isServerUnavailable]);

  // Auto-redirect if already authenticated (but not if server is down or retrying)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isServerUnavailable && !isRetrying) {
      const redirectTo = getAuthRedirectTarget() ?? '/';
      clearAuthRedirectTarget();
      navigate(redirectTo, {replace: true});
    }
  }, [isAuthenticated, isLoading, isServerUnavailable, isRetrying, navigate]);

  // Don't render anything if already authenticated and server is reachable, or still loading
  // But keep showing the page if retrying (to avoid blank flash)
  if (((isAuthenticated && !isServerUnavailable) || isLoading) && !isRetrying) {
    return null;
  }

  const handleSignIn = () => {
    setSignInError(null);
    setHasAttempted(true);
    setIsSigningIn(true);
    if (!getAuthRedirectTarget()) {
      saveAuthRedirectTarget('/');
    }
    signIn();
  };

  const signOutNoticeMessage = getSignOutNoticeMessage(signOutNotice, t);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Card sx={{width: '100%', maxWidth: 400}}>
          <CardContent sx={{p: 4}}>
            <Box sx={{textAlign: 'center', mb: 4}}>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('auth.signIn.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('auth.signIn.subtitle')}
              </Typography>
            </Box>
            {signOutNoticeMessage && !isServerUnavailable && (
              <Alert severity="warning" sx={{mb: 2}}>
                {signOutNoticeMessage}
              </Alert>
            )}
            {signInError && (
              <Alert severity="error" sx={{mb: 2}}>
                {signInError}
              </Alert>
            )}
            {isServerUnavailable && (
              <Alert severity="error" sx={{mb: 2}}>
                {t('auth.errors.serviceUnavailable')}
              </Alert>
            )}
            {isServerUnavailable || isRetrying ? (
              <Button
                variant="contained"
                fullWidth
                size="large"
                loading={isRetrying}
                onClick={() => {
                  setIsRetrying(true);
                  retryAuth();
                }}
                sx={{mb: 2}}
              >
                {t('retry')}
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSignIn}
                loading={isSigningIn}
                sx={{mb: 2}}
              >
                {t('auth.signIn.button')}
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
