import {createStorageEntry} from './browserStorage';

const store = createStorageEntry<string>('ids:currentLocationId', 1);

export function getSavedLocationId(): string | null {
  return store.get();
}

export function saveLocationId(locationId: string): void {
  store.set(locationId);
}

export function clearSavedLocationId(): void {
  store.remove();
}
