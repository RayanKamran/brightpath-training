import type {ReactNode} from 'react';
import {vi} from 'vitest';

/**
 * Mock LocationContext for testing
 */
export const mockLocationContext = {
  locations: [
    {id: 'loc-1', name: 'Test Location 1'},
    {id: 'loc-2', name: 'Test Location 2'},
  ],
  currentLocation: {id: 'loc-1', name: 'Test Location 1'},
  locationToken: 'mock-location-token',
  isLoading: false,
  isTokenLoading: false,
  tokenError: null,
  switchLocation: vi.fn(),
  refreshLocations: vi.fn(),
  fetchLocationName: vi.fn(),
};

/**
 * Mock Auth context for testing
 */
export const mockAuthContext = {
  isAuthenticated: true,
  isLoading: false,
  error: null,
  accessToken: 'mock-access-token',
  signIn: vi.fn(),
  signOut: vi.fn(),
};

/**
 * Create a mock LocationProvider for tests
 */
export const MockLocationProvider = ({children}: {children: ReactNode}) => {
  return <>{children}</>;
};

/**
 * Mock useLocation hook
 */
export const mockUseLocation = () => mockLocationContext;

/**
 * Mock useAuth hook
 */
export const mockUseAuth = () => mockAuthContext;

/**
 * Setup mocks for LocationContext and AuthContext
 */
export const setupContextMocks = () => {
  vi.mock('../../app/contexts/LocationContext', () => ({
    useLocation: mockUseLocation,
    LocationProvider: MockLocationProvider,
  }));

  vi.mock('../../app/contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
  }));
};
