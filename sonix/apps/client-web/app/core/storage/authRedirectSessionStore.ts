const KEY = 'ids_pre_auth_path';

export function saveAuthRedirectTarget(url: string): void {
  try {
    sessionStorage.setItem(KEY, url);
  } catch {
    /* ignore */
  }
}

export function getAuthRedirectTarget(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearAuthRedirectTarget(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
