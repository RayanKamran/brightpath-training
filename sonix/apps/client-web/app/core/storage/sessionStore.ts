import {createStorageEntry} from './browserStorage';

export type SignOutNoticeKind =
  | 'session_expired'
  | 'session_invalid'
  | 'no_locations_assigned'
  | 'tenant_access_lost'
  | 'auth_error'
  | 'server_unavailable';

const store = createStorageEntry<SignOutNoticeKind>('ids:signOutNotice', 1);

export function setSignOutNotice(kind: SignOutNoticeKind): void {
  store.set(kind);
}

export function getSignOutNotice(): SignOutNoticeKind | null {
  return store.get();
}

export function clearSignOutNotice(): void {
  store.remove();
}
