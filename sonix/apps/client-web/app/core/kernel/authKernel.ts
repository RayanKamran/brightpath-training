import type {Location, UserClaims, UserProfile} from '../../types/auth';
import {API_CONFIG} from '../config/api';
import {
  NetworkOfflineError,
  RequestTimeoutError,
  ServerUnreachableError,
} from '../config/apiErrors';
import type {SignOutNoticeKind} from '../storage/sessionStore';
import {setSignOutNotice} from '../storage/sessionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthStatus = 'initializing' | 'signed_out' | 'authenticated' | 'error';

export type AuthSnapshot = {
  status: AuthStatus;
  accessToken: string | null;
  userId: string | null;
  userClaims: UserClaims | null;
  profile: UserProfile | null;
  locations: Location[];
  error: string | null;
  hasResolved: boolean;
};

export type AuthBridge = {
  getAccessToken: (resource: string) => Promise<string>;
  getIdTokenClaims: () => Promise<UserClaims | undefined>;
  fetchUserContext: (
    token: string,
  ) => Promise<{profile: UserProfile | null; locations: Location[]}>;
  signOut: (redirectUri: string) => Promise<void>;
  clearAllTokens: () => Promise<void>;
};

type AuthSessionState = {
  hasSession: boolean;
  isLoading: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SNAPSHOT: AuthSnapshot = {
  status: 'initializing',
  accessToken: null,
  userId: null,
  userClaims: null,
  profile: null,
  locations: [],
  error: null,
  hasResolved: false,
};

/** Maps known OIDC / backend error codes to sign-out notice kinds. */
const FAILURE_TO_NOTICE = new Map<string, SignOutNoticeKind>([
  ['invalid_grant', 'session_expired'],
  ['invalid_client', 'session_invalid'],
  ['urn:dms:auth:no-locations', 'no_locations_assigned'],
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSnapshot(overrides: Partial<AuthSnapshot>): AuthSnapshot {
  return {...DEFAULT_SNAPSHOT, ...overrides};
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function classifyFailure(error: Error): SignOutNoticeKind {
  const message = error.message;
  for (const [pattern, notice] of FAILURE_TO_NOTICE) {
    if (message.includes(pattern)) {
      return notice;
    }
  }
  return 'auth_error';
}

/**
 * Detect network/server errors that should NOT trigger forced sign-out.
 * These mean the backend is unreachable — the Logto session is still valid.
 */
function isNetworkError(error: Error): boolean {
  return (
    error instanceof NetworkOfflineError ||
    error instanceof ServerUnreachableError ||
    error instanceof RequestTimeoutError ||
    error instanceof TypeError // fetch() throws TypeError when network is down
  );
}

// ---------------------------------------------------------------------------
// AuthKernel
// ---------------------------------------------------------------------------

/**
 * Central auth coordinator shared by React providers, router middleware, and API clients.
 *
 * Why this exists:
 * - The Logto SDK is only available inside React, but route middleware and services
 *   also need resolved auth state and valid access tokens.
 * - Router guards must wait for a single auth source of truth before protected
 *   loaders run, so the kernel owns the resolved snapshot and waiter queue.
 * - React reads this non-React store through `useSyncExternalStore`, which gives
 *   a safe subscription bridge without making React the owner of auth orchestration.
 */
class AuthKernel {
  private _snapshot: AuthSnapshot = createSnapshot({});
  private _listeners = new Set<() => void>();
  private _pendingWaiters: Array<(snapshot: AuthSnapshot) => void> = [];
  private _refreshPromise: Promise<string | null> | null = null;
  private _bridge: AuthBridge | null = null;
  private _session: AuthSessionState = {hasSession: false, isLoading: true};

  /**
   * Guards against stale async completions. Incremented at the start of every
   * `resolveAuth()` call; if the counter has advanced by the time the async
   * work finishes, the result is discarded.
   */
  private _resolutionSequence = 0;
  private _isResolving = false;
  /** Set after a failed auth resolution to prevent retry loops until session changes. */
  private _hasFailedForCurrentSession = false;

  // -- Public: useSyncExternalStore contract --------------------------------

  public getSnapshot = (): AuthSnapshot => {
    return this._snapshot;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  // -- Public: bridge & session sync ----------------------------------------

  /** Connects the Logto SDK functions so the kernel can operate without React. */
  public registerBridge(bridge: AuthBridge): void {
    this._bridge = bridge;
  }

  /**
   * Called by AuthProvider when the Logto SDK session state changes.
   * The kernel uses this to decide whether to trigger `resolveAuth()`.
   */
  public syncSession(state: {hasSession: boolean; isLoading: boolean}): void {
    this._session = {
      hasSession: Boolean(state.hasSession),
      isLoading: state.isLoading,
    };

    if (state.isLoading) {
      return;
    }

    if (!state.hasSession) {
      this._hasFailedForCurrentSession = false;
      this.commit(createSnapshot({status: 'signed_out', hasResolved: true}));
      return;
    }

    // Already authenticated and aligned with the session — nothing to do.
    if (this._snapshot.hasResolved && this._snapshot.status === 'authenticated') {
      return;
    }

    // Don't re-enter if already resolving.
    if (this._isResolving) {
      return;
    }

    // Don't retry after a failed resolution for the same session.
    // Reset only happens when session changes (sign-out → sign-in).
    if (this._hasFailedForCurrentSession) {
      return;
    }

    // Don't resolve during the callback — Logto SDK is exchanging the auth code
    // and calling getAccessToken() would deadlock.
    if (window.location.pathname === '/callback') {
      return;
    }

    this.resolveAuth();
  }

  // -- Public: token access -------------------------------------------------

  /** Returns the current access token from the snapshot (may be stale). */
  public getAccessToken(): string | null {
    return this._snapshot.accessToken;
  }

  /**
   * Returns a deduplicated token refresh promise. Multiple callers (e.g.
   * concurrent API requests hitting a 401) share the same in-flight refresh.
   */
  public getValidToken(): Promise<string | null> {
    if (!this._refreshPromise) {
      this._refreshPromise = this.refreshAccessToken().finally(() => {
        this._refreshPromise = null;
      });
    }
    return this._refreshPromise;
  }

  // -- Public: middleware integration ---------------------------------------

  /**
   * Returns a promise that resolves once `hasResolved` becomes `true`.
   * Router middleware calls this to block route loading until auth settles.
   */
  public waitForResolvedAuth(): Promise<AuthSnapshot> {
    if (this._snapshot.hasResolved) {
      return Promise.resolve(this._snapshot);
    }
    return new Promise<AuthSnapshot>((resolve) => {
      this._pendingWaiters.push(resolve);
    });
  }

  /**
   * Retry auth resolution after a server-unavailable error.
   * Clears the failed-session guard and re-triggers `resolveAuth()`.
   * Called from the sign-in page Retry button.
   */
  public retryAuth(): void {
    if (this._snapshot.error !== 'server_unavailable') {
      return;
    }
    this._hasFailedForCurrentSession = false;
    this._isResolving = false;
    this.commit(createSnapshot({status: 'initializing', hasResolved: false}));
    this.resolveAuth();
  }

  // -- Internal: auth resolution --------------------------------------------

  /**
   * Verify identity with Logto, fetch user context from backend, then commit
   * the authenticated snapshot. Uses a sequence counter to discard stale results.
   */
  private async resolveAuth(): Promise<void> {
    if (!this._bridge || !this._session.hasSession) {
      return;
    }

    this._isResolving = true;
    const sequence = ++this._resolutionSequence;
    const bridge = this._bridge;

    try {
      // Step 1: Get access token and user claims from Logto
      const [token, claims] = await Promise.all([
        bridge.getAccessToken(API_CONFIG.resourceIdentifier),
        bridge.getIdTokenClaims(),
      ]);

      if (sequence !== this._resolutionSequence) {
        return;
      }

      // Token may resolve to undefined/null if the Logto SDK session isn't
      // fully restored yet (e.g., immediately after a page reload). Treat this
      // as "not yet authenticated" rather than a fatal error — the next
      // syncSession() call will trigger a retry once the session is ready.
      if (!token) {
        this._isResolving = false;
        this.commit(createSnapshot({status: 'signed_out', hasResolved: true}));
        return;
      }

      if (!claims?.sub) {
        throw new Error('Missing user claims: no subject identifier in ID token');
      }

      // Step 2: Fetch user context (profile + locations) from backend
      const {profile, locations} = await bridge.fetchUserContext(token);

      if (sequence !== this._resolutionSequence) {
        return;
      }

      if (locations.length === 0) {
        const noLocationsError = new Error('urn:dms:auth:no-locations');
        throw noLocationsError;
      }

      this._isResolving = false;
      this._hasFailedForCurrentSession = false;
      this.commit(
        createSnapshot({
          status: 'authenticated',
          accessToken: token,
          userId: claims.sub,
          userClaims: claims,
          profile,
          locations,
          hasResolved: true,
        }),
      );
    } catch (error) {
      this._isResolving = false;
      this._hasFailedForCurrentSession = true;

      if (sequence !== this._resolutionSequence) {
        return;
      }

      const normalized = normalizeError(error);

      // "Not authenticated" from Logto SDK means the session isn't ready yet
      // (e.g., callback hasn't completed). Don't force sign-out — just mark
      // as signed out and let the middleware handle the redirect.
      if (normalized.message.includes('Not authenticated')) {
        this.commit(createSnapshot({status: 'signed_out', hasResolved: true}));
        return;
      }

      // Network/server errors mean the backend is unreachable — the Logto session
      // is still valid. Don't force sign-out; park in error state so the sign-in
      // page can show a "server unavailable" message with a Retry button.
      if (isNetworkError(normalized)) {
        this.commit(
          createSnapshot({
            status: 'error',
            error: 'server_unavailable',
            hasResolved: true,
          }),
        );
        return;
      }

      const noticeKind = classifyFailure(normalized);

      this.commit(
        createSnapshot({
          status: 'error',
          error: normalized.message,
          hasResolved: true,
        }),
      );

      setSignOutNotice(noticeKind);
      this.performForcedSignOut();
    }
  }

  /** Re-fetch the access token from Logto without a full re-resolution. */
  private async refreshAccessToken(): Promise<string | null> {
    if (!this._bridge || !this._session.hasSession) {
      return null;
    }

    try {
      const token = await this._bridge.getAccessToken(API_CONFIG.resourceIdentifier);

      // Only update the token field; do not re-derive the entire snapshot.
      if (this._snapshot.status === 'authenticated') {
        this.commit({...this._snapshot, accessToken: token});
      }

      return token;
    } catch (error) {
      const normalized = normalizeError(error);
      const noticeKind = classifyFailure(normalized);

      this.commit(
        createSnapshot({
          status: 'error',
          error: normalized.message,
          hasResolved: true,
        }),
      );

      setSignOutNotice(noticeKind);
      this.performForcedSignOut();
      return null;
    }
  }

  // -- Internal: state management -------------------------------------------

  private commit(next: AuthSnapshot): void {
    if (next === this._snapshot) {
      return;
    }

    this._snapshot = next;
    this.emitChange();
  }

  private emitChange(): void {
    for (const listener of this._listeners) {
      listener();
    }

    if (!this._snapshot.hasResolved || this._pendingWaiters.length === 0) {
      return;
    }

    const waiters = this._pendingWaiters;
    this._pendingWaiters = [];
    for (const resolve of waiters) {
      resolve(this._snapshot);
    }
  }

  // -- Internal: forced sign-out --------------------------------------------

  /** Best-effort background sign-out after a fatal auth error. */
  private performForcedSignOut(): void {
    if (!this._bridge) {
      return;
    }
    const bridge = this._bridge;
    this.signOutInBackground(bridge);
  }

  private async signOutInBackground(bridge: AuthBridge): Promise<void> {
    try {
      await bridge.clearAllTokens();
      await bridge.signOut(`${window.location.origin}/`);
    } catch {
      // Auth state is already marked invalid; router guards fail closed.
    }
  }
}

export const authKernel = new AuthKernel();
