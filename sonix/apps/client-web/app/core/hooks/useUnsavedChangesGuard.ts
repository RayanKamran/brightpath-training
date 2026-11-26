import {useEffect, useRef} from 'react';
import {Blocker, useBlocker} from 'react-router';
import {useLocationChangeGuard} from '../contexts/location/LocationChangeGuardContext';

/**
 * Guards against accidental navigation when the form has unsaved changes.
 *
 * Combines React Router's `useBlocker` (in-app navigation, back button) with the
 * `beforeunload` event (browser close, refresh, URL bar navigation).
 *
 * Automatically defers to the location-change guard when a location switch is pending,
 * so only one confirmation dialog shows at a time. The `beforeunload` handler is
 * bypassed when the location change prompt confirms a hard navigation.
 *
 * @param isDirty - Whether the form has unsaved changes. Typically `formState.isDirty` from RHF.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const {pendingSwitch, registerBeforeUnloadBypass} = useLocationChangeGuard();
  const isLocationSwitching: boolean = pendingSwitch !== null;
  const bypassRef = useRef(false);

  // Register the bypass callback so the location change prompt can suppress
  // the native "leave site?" dialog before doing a hard navigation.
  useEffect(() => {
    registerBeforeUnloadBypass(() => {
      bypassRef.current = true;
    });
  }, [registerBeforeUnloadBypass]);

  // Don't block navigation when a location switch is already being handled.
  // Don't block form submissions (useSubmit posts to the same pathname).
  const blocker: Blocker = useBlocker(
    ({currentLocation, nextLocation}) =>
      isDirty && !isLocationSwitching && currentLocation.pathname !== nextLocation.pathname,
  );

  // Bypass beforeunload during Vite HMR full reloads (dev only).
  // Without this, editing a form and saving a file triggers the browser's
  // native "Leave this page?" dialog because Vite's full reload fires beforeunload.
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeFullReload', () => {
        bypassRef.current = true;
      });
    }
  }, []);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (e: BeforeUnloadEvent) => {
      if (bypassRef.current) {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isDirty]);

  return {
    showDialog: blocker.state === 'blocked',
    confirm: () => blocker.proceed?.(),
    cancel: () => blocker.reset?.(),
  };
}
