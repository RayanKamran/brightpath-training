import {API_CONFIG} from '../config/api';

export type NetworkStatus = 'connected' | 'noNetwork' | 'noServerAccess';

type NetworkSnapshot = {
  status: NetworkStatus;
  lastStatus: NetworkStatus;
};

type NetworkListener = () => void;

class NetworkMonitor {
  private _status: NetworkStatus = 'connected';
  private _lastStatus: NetworkStatus = 'connected';
  private readonly _listeners = new Set<NetworkListener>();
  private _snapshot: NetworkSnapshot = {
    status: 'connected',
    lastStatus: 'connected',
  };
  private _healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _isChecking = false;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => this.verifyConnectivity());
    window.addEventListener('offline', () => this.handleChange('noNetwork'));
  }

  public getStatus(): NetworkStatus {
    return this._status;
  }

  public isOnline(): boolean {
    return this._status === 'connected';
  }

  /**
   * Subscribe to network status changes.
   * Compatible with useSyncExternalStore — bound method reference is stable.
   */
  public subscribe = (listener: NetworkListener): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  /**
   * Return an immutable snapshot for useSyncExternalStore.
   * The object reference only changes when status actually changes.
   */
  public getSnapshot = (): NetworkSnapshot => {
    return this._snapshot;
  };

  /**
   * Called by apiClient when a fetch fails with a network-level TypeError.
   * Transitions to noServerAccess so the UI can show a banner and periodic
   * health checks begin to detect recovery.
   */
  public reportServerUnreachable(): void {
    if (this._status !== 'noNetwork') {
      this.handleChange('noServerAccess');
    }
  }

  /**
   * Fire a one-off health check without blocking. Used after request timeouts
   * to silently probe whether the server is still reachable.
   */
  public checkHealth(): void {
    this.verifyConnectivity();
  }

  private async verifyConnectivity(): Promise<void> {
    if (this._isChecking) {
      return;
    }

    this._isChecking = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      await fetch(API_CONFIG.healthUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      this.handleChange('connected');
    } catch {
      this.handleChange('noServerAccess');
    } finally {
      this._isChecking = false;
    }
  }

  private handleChange(status: NetworkStatus): void {
    if (this._status === status) {
      return;
    }

    this._lastStatus = this._status;
    this._status = status;
    this._snapshot = {status: this._status, lastStatus: this._lastStatus};

    if (status === 'noServerAccess') {
      this.startPeriodicHealthChecks();
    } else {
      this.stopPeriodicHealthChecks();
    }

    for (const listener of this._listeners) {
      listener();
    }
  }

  private startPeriodicHealthChecks(): void {
    if (this._healthCheckInterval) {
      return;
    }
    this._healthCheckInterval = setInterval(() => {
      this.verifyConnectivity();
    }, 10_000);
  }

  private stopPeriodicHealthChecks(): void {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }
  }
}

export const networkMonitor = new NetworkMonitor();
