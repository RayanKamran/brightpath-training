import {createContext, useCallback, useContext, useRef, useState} from 'react';

type PendingSwitch = {
  logtoId: string;
};

type BeforeUnloadBypass = () => void;

type LocationChangeGuardContextValue = {
  /** Register a guard — returns an unregister function. While registered, location switches are intercepted. */
  registerGuard: () => () => void;
  /** Called by LocationSwitcher before switching. Returns true if switch should proceed, false if blocked. */
  requestSwitch: (logtoId: string) => boolean;
  /** The pending switch that was blocked (if any). Null when no guard is active or switch was allowed. */
  pendingSwitch: PendingSwitch | null;
  /** Confirm the pending switch — proceeds with location change. */
  confirmSwitch: () => string | null;
  /** Cancel the pending switch — stays on current page. */
  cancelSwitch: () => void;
  /** Register a beforeunload bypass callback (called by useUnsavedChangesGuard). */
  registerBeforeUnloadBypass: (bypass: BeforeUnloadBypass) => void;
  /** Call all registered bypass callbacks to suppress native "leave site?" dialogs before hard navigation. */
  disableAllBeforeUnload: () => void;
};

const LocationChangeGuardCtx = createContext<LocationChangeGuardContextValue | null>(null);

export function LocationChangeGuardProvider({children}: {children: React.ReactNode}) {
  const guardCountRef = useRef(0);
  const bypassCallbacksRef = useRef<Set<BeforeUnloadBypass>>(new Set());
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);

  const registerGuard = useCallback(() => {
    guardCountRef.current++;
    return () => {
      guardCountRef.current--;
      if (guardCountRef.current === 0) {
        setPendingSwitch(null);
      }
    };
  }, []);

  const requestSwitch = useCallback((logtoId: string): boolean => {
    if (guardCountRef.current > 0) {
      setPendingSwitch({logtoId});
      return false;
    }
    return true;
  }, []);

  const confirmSwitch = useCallback((): string | null => {
    const pending: PendingSwitch | null = pendingSwitch;
    setPendingSwitch(null);

    return pending?.logtoId ?? null;
  }, [pendingSwitch]);

  const cancelSwitch = useCallback(() => {
    setPendingSwitch(null);
  }, []);

  const registerBeforeUnloadBypass = useCallback((bypass: BeforeUnloadBypass) => {
    bypassCallbacksRef.current.add(bypass);
  }, []);

  const disableAllBeforeUnload = useCallback(() => {
    for (const bypass of bypassCallbacksRef.current) {
      bypass();
    }
  }, []);

  return (
    <LocationChangeGuardCtx.Provider
      value={{
        registerGuard,
        requestSwitch,
        pendingSwitch,
        confirmSwitch,
        cancelSwitch,
        registerBeforeUnloadBypass,
        disableAllBeforeUnload,
      }}
    >
      {children}
    </LocationChangeGuardCtx.Provider>
  );
}

export function useLocationChangeGuard() {
  const ctx = useContext(LocationChangeGuardCtx);
  if (!ctx) {
    throw new Error('useLocationChangeGuard must be used within LocationChangeGuardProvider');
  }

  return ctx;
}
