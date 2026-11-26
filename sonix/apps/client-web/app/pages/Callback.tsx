import {useHandleSignInCallback} from '@logto/react';
import {AppLoading} from '../components/AppLoading';
import {
  clearAuthRedirectTarget,
  getAuthRedirectTarget,
} from '../core/storage/authRedirectSessionStore';
import i18n from '../i18n';

/**
 * One-shot guard against the callback firing more than once per page load.
 *
 * `useHandleSignInCallback` can invoke its callback multiple times because
 * `isLoading` / `isAuthenticated` from LogtoContext cycle during the OIDC
 * code exchange, and React Strict Mode double-invokes effects in development.
 * A module-level variable resets exactly when the module is reloaded — which
 * always happens on the hard navigation from Logto back to /callback.
 */
let callbackNavigating = false;

export default function Callback() {
  const {isLoading} = useHandleSignInCallback(() => {
    if (callbackNavigating) {
      return;
    }
    callbackNavigating = true;
    const redirectTo = getAuthRedirectTarget() ?? '/';
    clearAuthRedirectTarget();
    window.location.replace(redirectTo);
  });

  if (isLoading) {
    return <AppLoading message={i18n.t('verifyingPermissions')} />;
  }

  return null;
}
