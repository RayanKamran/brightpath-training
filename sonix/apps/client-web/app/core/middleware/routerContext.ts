import {createContext, RouterContextProvider} from 'react-router';
import type {AuthSnapshot} from '../kernel/authKernel';
import {authKernel} from '../kernel/authKernel';
import type {LocationSnapshot, ResolvedLocationContext} from '../kernel/locationKernel';
import {locationKernel} from '../kernel/locationKernel';

// Public-only kernel interface types for the router context.
// Using `typeof kernel` would leak private members into the exported context type.
type AuthKernelPublic = {
  getSnapshot: () => AuthSnapshot;
  subscribe: (listener: () => void) => () => void;
  syncSession: (state: {hasSession: boolean; isLoading: boolean}) => void;
  registerBridge: (bridge: unknown) => void;
  getAccessToken: () => string | null;
  getValidToken: () => Promise<string | null>;
  waitForResolvedAuth: () => Promise<AuthSnapshot>;
};

type LocationKernelPublic = {
  getSnapshot: () => LocationSnapshot;
  subscribe: (listener: () => void) => () => void;
  connect: (authKernel: unknown, bridge: unknown) => () => void;
  switchLocation: (logtoLocationId: string) => Promise<void>;
  refreshLocationToken: () => Promise<string | null>;
  waitForResolvedLocation: () => Promise<LocationSnapshot>;
};

export const AUTH_KERNEL_CONTEXT = createContext<AuthKernelPublic>();
export const LOCATION_KERNEL_CONTEXT = createContext<LocationKernelPublic>();
export const RESOLVED_LOCATION_CONTEXT = createContext<ResolvedLocationContext | null>(null);

/**
 * Creates a pre-populated RouterContextProvider for use in the router config.
 * Provides kernel singletons to middleware and loaders via typed context keys.
 */
export function createRouterContext(): RouterContextProvider {
  const init = new Map();
  init.set(AUTH_KERNEL_CONTEXT, authKernel);
  init.set(LOCATION_KERNEL_CONTEXT, locationKernel);
  return new RouterContextProvider(init);
}
