export function createStorageEntry<T>(key: string, version: number) {
  const versionedKey = `${key}:v${version}`;
  return {
    get(): T | null {
      try {
        const raw = localStorage.getItem(versionedKey);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    set(value: T): void {
      try {
        localStorage.setItem(versionedKey, JSON.stringify(value));
      } catch {
        /* quota exceeded or private mode */
      }
    },
    remove(): void {
      try {
        localStorage.removeItem(versionedKey);
      } catch {
        /* ignore */
      }
    },
  };
}
