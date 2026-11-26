import {useSyncExternalStore} from 'react';
import type {NetworkStatus} from '../services/networkMonitor';
import {networkMonitor} from '../services/networkMonitor';

const SERVER_SNAPSHOT_DETAILED: {status: NetworkStatus; lastStatus: NetworkStatus} = {
  status: 'connected',
  lastStatus: 'connected',
};

export function useNetworkStatus(): boolean {
  return useSyncExternalStore(
    (callback) => networkMonitor.subscribe(callback),
    () => networkMonitor.isOnline(),
    () => true,
  );
}

export function useNetworkStatusDetailed(): {status: NetworkStatus; lastStatus: NetworkStatus} {
  return useSyncExternalStore(
    (callback) => networkMonitor.subscribe(callback),
    () => networkMonitor.getSnapshot(),
    () => SERVER_SNAPSHOT_DETAILED,
  );
}
