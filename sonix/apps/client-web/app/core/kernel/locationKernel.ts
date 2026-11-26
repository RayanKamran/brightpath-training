import type {Location} from '../../types/auth';
import {clearSavedLocationId, getSavedLocationId, saveLocationId} from '../storage/locationStorage';
import type {SignOutNoticeKind} from '../storage/sessionStore';
import {setSignOutNotice} from '../storage/sessionStore';
import type {AuthSnapshot} from './authKernel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResolvedLocationContext = {
  locationId: string;
  locationToken: string;
  logtoLocationId: string;
};

export type LocationAccessState =
  | {kind: 'pending'}
  | {kind: 'ready'; resolvedLocation: ResolvedLocationContext}
  | {kind: 'signed_out'}
  | {kind: 'tenant_access_lost'};

export type LocationSnapshot = {
  accessState: LocationAccessState;
  locations: Location[];
  currentLocationId: string | null;
  hasResolved: boolean;
};

export type LocationBridge = {
  fetchLocationToken: (logtoLocationId: string) => Promise<string>;
  signOut: (redirectUri: string) => Promise<void>;
};

type TokenCacheEntry = {
  token: string;
  expiresAt: number;
};

type AuthKernelLike = {
  getSnapshot(): AuthSnapshot;
  subscribe(listener: () => void): () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Safety window subtracted from the token's remaining lifetime to compute the
 * cache TTL. Ensures we evict and refresh before the token actually expires.
 */
const CACHE_SAFETY_WINDOW_MS = 10 * 60 * 1_000;

/**
 * Fallback cache TTL used when the token carries no `exp` claim.
 * Conservative estimate based on Logto's default access_token_ttl of 1 hour.
 */
const CACHE_FALLBACK_TTL_MS = 50 * 60 * 1_000;

/** Minimum cache TTL — prevents a zero or negative value reaching the cache. */
const MIN_CACHE_TTL_MS = 1_000;

const PENDING_ACCESS_STATE: LocationAccessState = {kind: 'pending'};
const SIGNED_OUT_ACCESS_STATE: LocationAccessState = {kind: 'signed_out'};

const DEFAULT_SNAPSHOT: LocationSnapshot = {
  accessState: PENDING_ACCESS_STATE,
  locations: [],
  currentLocationId: null,
  hasResolved: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSnapshot(overrides: Partial<LocationSnapshot>): LocationSnapshot {
  return {...DEFAULT_SNAPSHOT, ...overrides};
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Decodes the `exp` claim from a JWT without verifying the signature.
 * Logto has already verified the token — we only need the expiry for caching.
 * Returns the expiry as a Unix timestamp in milliseconds, or null if unavailable.
 */
function decodeTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1_000 : null;
  } catch {
    return null;
  }
}

/**
 * Computes how long to cache a location token.
 *
 * Strategy:
 * - Read the `exp` claim from the JWT to get the actual remaining lifetime.
 * - Subtract a 10-minute safety window so we refresh before expiry.
 * - If the remaining lifetime is ≤ 10 minutes (window would give zero or negative),
 *   skip the window and cache for the full remaining lifetime instead.
 * - Always clamp to a 1-second minimum so the value is never zero or negative.
 * - Fall back to 50 minutes if the token carries no `exp` claim.
 */
function computeCacheTtl(token: string): number {
  const expiryMs = decodeTokenExpiry(token);
  if (expiryMs === null) {
    return CACHE_FALLBACK_TTL_MS;
  }

  const remainingMs = expiryMs - Date.now();

  if (remainingMs <= CACHE_SAFETY_WINDOW_MS) {
    // Token lifetime is too short to apply the safety window.
    // Cache for the full remaining lifetime, at least 1 second.
    return Math.max(MIN_CACHE_TTL_MS, remainingMs);
  }

  return remainingMs - CACHE_SAFETY_WINDOW_MS;
}

function isFatalTokenError(error: Error): boolean {
  return error.message.includes('invalid_client') || error.message.includes('invalid_grant');
}

/**
 * Given a list of locations and an optional saved preference, pick the location
 * the user should start with. Returns the logtoId to use as currentLocationId.
 */
function selectInitialLocation(locations: Location[], savedId: string | null): string | null {
  if (locations.length === 0) {
    return null;
  }

  // Prefer the saved location if it still exists in the user's list.
  if (savedId) {
    const saved = locations.find((l) => l.logtoId === savedId);
    if (saved) {
      return saved.logtoId;
    }
  }

  // Fall back to the first available location.
  return locations[0].logtoId;
}

// ---------------------------------------------------------------------------
// LocationKernel
// ---------------------------------------------------------------------------

/**
 * Central tenant coordinator shared by React providers, router middleware, and loaders.
 *
 * Why this exists:
 * - Tenant-aware routes must not run loaders until a valid location and location
 *   token have been resolved.
 * - The auth SDK and fetch bridges live in React, but route middleware must wait on
 *   the same tenant access state outside React.
 * - React reads this non-React store through `useSyncExternalStore`, while the kernel
 *   owns waiters, token caching, and location-switch orchestration.
 */
class LocationKernel {
  private _snapshot: LocationSnapshot = createSnapshot({});
  private _listeners = new Set<() => void>();
  private _pendingWaiters: Array<(snapshot: LocationSnapshot) => void> = [];
  private _bridge: LocationBridge | null = null;
  private _unsubscribeAuth: (() => void) | null = null;
  private _refreshPromise: Promise<string | null> | null = null;

  /**
   * Guards against stale async completions. Incremented at the start of every
   * location resolution; if the counter advances the in-flight result is discarded.
   */
  private _resolutionSequence = 0;

  /** Simple in-memory token cache keyed by logtoLocationId. */
  private _tokenCache = new Map<string, TokenCacheEntry>();

  // -- Public: useSyncExternalStore contract --------------------------------

  public getSnapshot = (): LocationSnapshot => {
    return this._snapshot;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  // -- Public: lifecycle ----------------------------------------------------

  /**
   * Subscribes to auth kernel state and wires the Logto organization token bridge.
   * Call once from LocationProvider; returns a cleanup function.
   */
  public connect(authKernel: AuthKernelLike, bridge: LocationBridge): () => void {
    this.disconnect();
    this._bridge = bridge;

    const syncFromAuth = () => {
      this.handleAuthSnapshot(authKernel.getSnapshot());
    };

    this._unsubscribeAuth = authKernel.subscribe(syncFromAuth);
    // Sync immediately so we don't miss an already-resolved auth state.
    syncFromAuth();

    return () => {
      this.disconnect();
    };
  }

  /** Tear down subscriptions and clear bridge references. */
  public disconnect(): void {
    this._unsubscribeAuth?.();
    this._unsubscribeAuth = null;
    this._bridge = null;
    this._refreshPromise = null;
  }

  // -- Public: location switching -------------------------------------------

  /**
   * Switch the active location. Validates membership, fetches a new organization
   * token, persists the preference, and commits the new snapshot.
   */
  public async switchLocation(logtoLocationId: string): Promise<void> {
    if (!this._bridge) {
      throw new Error('LocationKernel: bridge not connected');
    }

    const locations = this._snapshot.locations;
    const target = locations.find((l) => l.logtoId === logtoLocationId);
    if (!target) {
      throw new Error('LocationKernel: selected location not found in user locations');
    }

    if (logtoLocationId === this._snapshot.currentLocationId) {
      return;
    }

    const sequence = ++this._resolutionSequence;
    const bridge = this._bridge;

    try {
      const token = await this.fetchTokenWithCache(logtoLocationId, bridge);

      if (sequence !== this._resolutionSequence) {
        return;
      }

      saveLocationId(logtoLocationId);

      this.commit(
        createSnapshot({
          accessState: {
            kind: 'ready',
            resolvedLocation: {
              locationId: target.id,
              locationToken: token,
              logtoLocationId,
            },
          },
          locations,
          currentLocationId: logtoLocationId,
          hasResolved: true,
        }),
      );
    } catch (error) {
      if (sequence !== this._resolutionSequence) {
        return;
      }

      const normalized = normalizeError(error);
      if (isFatalTokenError(normalized)) {
        this.forceTenantAccessLost();
      } else {
        throw normalized;
      }
    }
  }

  // -- Public: token refresh ------------------------------------------------

  /**
   * Deduplicated token refresh for the current location. Used by the API client
   * when a 401 indicates the cached token has expired.
   */
  public refreshLocationToken(): Promise<string | null> {
    if (!this._refreshPromise) {
      this._refreshPromise = this.doRefreshLocationToken().finally(() => {
        this._refreshPromise = null;
      });
    }
    return this._refreshPromise;
  }

  // -- Public: middleware integration ---------------------------------------

  /**
   * Returns a promise that resolves once the location kernel has settled
   * (i.e. `hasResolved` is `true`). Used by router middleware to block
   * route loading until a location token is available.
   */
  public waitForResolvedLocation(): Promise<LocationSnapshot> {
    if (this._snapshot.hasResolved) {
      return Promise.resolve(this._snapshot);
    }
    return new Promise<LocationSnapshot>((resolve) => {
      this._pendingWaiters.push(resolve);
    });
  }

  // -- Internal: auth subscription ------------------------------------------

  private handleAuthSnapshot(authSnapshot: AuthSnapshot): void {
    const {status, locations} = authSnapshot;

    if (!authSnapshot.hasResolved) {
      // Auth is still initializing — stay pending.
      return;
    }

    if (status === 'signed_out' || status === 'error') {
      this._tokenCache.clear();
      clearSavedLocationId();

      this.commit(
        createSnapshot({
          accessState: SIGNED_OUT_ACCESS_STATE,
          locations: [],
          currentLocationId: null,
          hasResolved: true,
        }),
      );
      return;
    }

    if (status !== 'authenticated') {
      return;
    }

    // Auth is authenticated — resolve the active location.
    this.resolveLocation(locations);
  }

  // -- Internal: location resolution ----------------------------------------

  private async resolveLocation(locations: Location[]): Promise<void> {
    if (!this._bridge) {
      return;
    }

    const savedId = getSavedLocationId();
    const selectedId = selectInitialLocation(locations, savedId);

    if (!selectedId) {
      this.commit(
        createSnapshot({
          accessState: SIGNED_OUT_ACCESS_STATE,
          locations,
          currentLocationId: null,
          hasResolved: true,
        }),
      );
      return;
    }

    const target = locations.find((l) => l.logtoId === selectedId);
    if (!target) {
      this.commit(
        createSnapshot({
          accessState: SIGNED_OUT_ACCESS_STATE,
          locations,
          currentLocationId: null,
          hasResolved: true,
        }),
      );
      return;
    }

    const sequence = ++this._resolutionSequence;
    const bridge = this._bridge;

    try {
      const token = await this.fetchTokenWithCache(selectedId, bridge);

      if (sequence !== this._resolutionSequence) {
        return;
      }

      saveLocationId(selectedId);

      this.commit(
        createSnapshot({
          accessState: {
            kind: 'ready',
            resolvedLocation: {
              locationId: target.id,
              locationToken: token,
              logtoLocationId: selectedId,
            },
          },
          locations,
          currentLocationId: selectedId,
          hasResolved: true,
        }),
      );
    } catch (error) {
      if (sequence !== this._resolutionSequence) {
        return;
      }

      const normalized = normalizeError(error);
      if (isFatalTokenError(normalized)) {
        this.forceTenantAccessLost();
      } else {
        // Non-fatal error: stay pending so the middleware can retry.
        this.commit(
          createSnapshot({
            accessState: PENDING_ACCESS_STATE,
            locations,
            currentLocationId: selectedId,
            hasResolved: true,
          }),
        );
      }
    }
  }

  // -- Internal: token management -------------------------------------------

  private async fetchTokenWithCache(
    logtoLocationId: string,
    bridge: LocationBridge,
  ): Promise<string> {
    const cached = this._tokenCache.get(logtoLocationId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const token = await bridge.fetchLocationToken(logtoLocationId);

    this._tokenCache.set(logtoLocationId, {
      token,
      expiresAt: Date.now() + computeCacheTtl(token),
    });

    return token;
  }

  private async doRefreshLocationToken(): Promise<string | null> {
    if (!this._bridge || !this._snapshot.currentLocationId) {
      return null;
    }

    const locationId = this._snapshot.currentLocationId;
    // Evict the cached token to force a fresh fetch.
    this._tokenCache.delete(locationId);

    try {
      const token = await this.fetchTokenWithCache(locationId, this._bridge);

      // Update the snapshot with the fresh token if we're still on the same location.
      if (
        this._snapshot.currentLocationId === locationId &&
        this._snapshot.accessState.kind === 'ready'
      ) {
        this.commit({
          ...this._snapshot,
          accessState: {
            kind: 'ready',
            resolvedLocation: {
              ...this._snapshot.accessState.resolvedLocation,
              locationToken: token,
            },
          },
        });
      }

      return token;
    } catch (error) {
      const normalized = normalizeError(error);
      if (isFatalTokenError(normalized)) {
        this.forceTenantAccessLost();
      }
      return null;
    }
  }

  // -- Internal: state management -------------------------------------------

  private commit(next: LocationSnapshot): void {
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

  private forceTenantAccessLost(): void {
    if (!this._bridge) {
      return;
    }

    setSignOutNotice('tenant_access_lost' as SignOutNoticeKind);

    this.commit(
      createSnapshot({
        accessState: {kind: 'tenant_access_lost'},
        locations: this._snapshot.locations,
        currentLocationId: this._snapshot.currentLocationId,
        hasResolved: true,
      }),
    );

    const bridge = this._bridge;
    this.signOutInBackground(bridge);
  }

  private async signOutInBackground(bridge: LocationBridge): Promise<void> {
    try {
      await bridge.signOut(`${window.location.origin}/sign-in`);
    } catch {
      // Router guards fail closed; best-effort only.
    }
  }
}

export const locationKernel = new LocationKernel();
