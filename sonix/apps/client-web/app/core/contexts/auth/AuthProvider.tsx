import {useLogto} from '@logto/react';
import {createContext, useEffect, useMemo, useSyncExternalStore} from 'react';
import type {Location, UserClaims, UserProfile} from '../../../types/auth';
import {API_CONFIG} from '../../config/api';
import type {AuthBridge, AuthSnapshot} from '../../kernel/authKernel';
import {authKernel} from '../../kernel/authKernel';
import {apiClient} from '../../services/apiClient';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  userId: string | null;
  userClaims: UserClaims | null;
  profile: UserProfile | null;
  locations: Location[];
  error: string | null;
  status: AuthSnapshot['status'];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  retryAuth: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

// --- Provider ---//

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const {
    isAuthenticated,
    isLoading,
    getAccessToken,
    getIdTokenClaims,
    signIn,
    signOut,
    clearAllTokens,
  } = useLogto();

  // Register bridge on mount so the kernel can operate without React.
  useEffect(() => {
    const fetchUserContext = async (
      token: string,
    ): Promise<{profile: UserProfile | null; locations: Location[]}> => {
      return apiClient.get<{profile: UserProfile | null; locations: Location[]}>(
        `${API_CONFIG.baseUrl}/user/context`,
        {token},
      );
    };

    const bridge: AuthBridge = {
      getAccessToken: (resource: string) => getAccessToken(resource) as Promise<string>,
      getIdTokenClaims: () => getIdTokenClaims() as Promise<UserClaims | undefined>,
      fetchUserContext,
      signOut: (redirectUri: string) => signOut(redirectUri) as Promise<void>,
      clearAllTokens: () => clearAllTokens() as Promise<void>,
    };

    authKernel.registerBridge(bridge);
  }, [getAccessToken, getIdTokenClaims, signOut, clearAllTokens]);

  // Sync Logto session state into the kernel whenever it changes.
  useEffect(() => {
    authKernel.syncSession({hasSession: isAuthenticated, isLoading});
  }, [isAuthenticated, isLoading]);

  // Subscribe to the kernel snapshot for React state.
  const snapshot = useSyncExternalStore(
    authKernel.subscribe,
    authKernel.getSnapshot,
    authKernel.getSnapshot,
  );

  const value = useMemo<AuthContextValue>(() => {
    const handleSignIn = () => {
      return signIn(`${window.location.origin}/callback`);
    };

    const handleSignOut = async () => {
      if (clearAllTokens) {
        await clearAllTokens();
      }
      if (signOut) {
        await signOut(`${window.location.origin}/`);
      }
    };

    const handleRefreshToken = () => authKernel.getValidToken();

    return {
      isAuthenticated: snapshot.status === 'authenticated',
      isLoading: snapshot.status === 'initializing',
      accessToken: snapshot.accessToken,
      userId: snapshot.userId,
      userClaims: snapshot.userClaims,
      profile: snapshot.profile,
      locations: snapshot.locations,
      error: snapshot.error,
      status: snapshot.status,
      signIn: handleSignIn,
      signOut: handleSignOut,
      refreshToken: handleRefreshToken,
      retryAuth: () => authKernel.retryAuth(),
    };
  }, [snapshot, signIn, signOut, clearAllTokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
