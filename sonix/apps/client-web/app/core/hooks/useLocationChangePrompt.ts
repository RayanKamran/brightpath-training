import {useEffect} from 'react';
import {useLocationChangeGuard} from '../contexts/location/LocationChangeGuardContext';
import {useLocation} from '../contexts/location/useLocation';

/**
 * Registers a location-change guard while active.
 *
 * When the user tries to switch locations via the LocationSwitcher,
 * the switch is intercepted and a confirmation dialog can be shown.
 * On confirm, the location switch proceeds and the user is redirected
 * to the given `redirectTo` path via hard navigation.
 *
 * @param isActive - Whether the guard is active (e.g. `formState.isDirty`)
 * @param redirectTo - Path to navigate to after confirming (e.g. '/parts')
 */
export function useLocationChangePrompt(isActive: boolean, redirectTo: string) {
  const {registerGuard, pendingSwitch, confirmSwitch, cancelSwitch, disableAllBeforeUnload} =
    useLocationChangeGuard();
  const {switchLocation} = useLocation();

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const unregister = registerGuard();

    return unregister;
  }, [isActive, registerGuard]);

  const handleConfirm = async () => {
    const logtoId: string | null = confirmSwitch();
    if (logtoId) {
      await switchLocation(logtoId);

      // Suppress all beforeunload handlers before hard navigation
      // to prevent the browser's native "leave site?" dialog.
      disableAllBeforeUnload();
      window.location.replace(redirectTo);
    }
  };

  return {
    showDialog: pendingSwitch !== null,
    confirm: handleConfirm,
    cancel: cancelSwitch,
  };
}
