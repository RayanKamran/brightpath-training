import {useLogto} from '@logto/react';
import {createContext, useEffect, useMemo, useSyncExternalStore} from 'react';
import type {Location} from '../../../types/auth';
import {authKernel} from '../../kernel/authKernel';
import type {LocationBridge} from '../../kernel/locationKernel';
import {locationKernel} from '../../kernel/locationKernel';

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

type CurrentLocation = Location & {
  locationId: string;
  locationToken: string;
  logtoLocationId: string;
};

type LocationContextValue = {
  locations: Location[];
  currentLocation: CurrentLocation | null;
  locationToken: string | null;
  isLoading: boolean;
  switchLocation: (logtoLocationId: string) => Promise<void>;
  refreshLocationToken: () => Promise<string | null>;
};

export const LocationContext = createContext<LocationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type LocationProviderProps = {
  children: React.ReactNode;
};

export const LocationProvider: React.FC<LocationProviderProps> = ({children}) => {
  const {getOrganizationToken, signOut} = useLogto();

  // Connect the location kernel to the auth kernel on mount.
  useEffect(() => {
    const bridge: LocationBridge = {
      fetchLocationToken: (logtoLocationId: string) =>
        getOrganizationToken(logtoLocationId) as Promise<string>,
      signOut: (redirectUri: string) => signOut(redirectUri) as Promise<void>,
    };

    const disconnect = locationKernel.connect(authKernel, bridge);
    return disconnect;
  }, [getOrganizationToken, signOut]);

  // Subscribe to the kernel snapshot for React state.
  const snapshot = useSyncExternalStore(
    locationKernel.subscribe,
    locationKernel.getSnapshot,
    locationKernel.getSnapshot,
  );

  const value = useMemo<LocationContextValue>(() => {
    let currentLocation: CurrentLocation | null = null;

    if (snapshot.accessState.kind === 'ready') {
      const resolved = snapshot.accessState.resolvedLocation;
      // Find the full Location object matching the resolved location
      const fullLocation = snapshot.locations.find(
        (loc) => loc.logtoId === resolved.logtoLocationId || loc.id === resolved.locationId,
      );
      if (fullLocation) {
        currentLocation = {
          ...fullLocation,
          locationId: resolved.locationId,
          locationToken: resolved.locationToken,
          logtoLocationId: resolved.logtoLocationId,
        };
      }
    }

    const locationToken = currentLocation?.locationToken ?? null;

    return {
      locations: snapshot.locations,
      currentLocation,
      locationToken,
      isLoading: !snapshot.hasResolved,
      switchLocation: (logtoLocationId: string) => locationKernel.switchLocation(logtoLocationId),
      refreshLocationToken: () => locationKernel.refreshLocationToken(),
    };
  }, [snapshot]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
