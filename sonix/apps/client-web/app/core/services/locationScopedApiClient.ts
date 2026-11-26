import type {RequestOptions} from './apiClient';
import {apiClient} from './apiClient';

export function createLocationScopedClient(
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>,
) {
  const withLocationToken = (options?: RequestOptions): RequestOptions => ({
    ...options,
    token: getToken(),
    refreshToken,
  });

  return {
    get: <T>(url: string, options?: RequestOptions) =>
      apiClient.get<T>(url, withLocationToken(options)),
    post: <T>(url: string, body: unknown, options?: RequestOptions) =>
      apiClient.post<T>(url, body, withLocationToken(options)),
    patch: <T>(url: string, body: unknown, options?: RequestOptions) =>
      apiClient.patch<T>(url, body, withLocationToken(options)),
    put: <T>(url: string, body: unknown, options?: RequestOptions) =>
      apiClient.put<T>(url, body, withLocationToken(options)),
    delete: <T>(url: string, options?: RequestOptions) =>
      apiClient.delete<T>(url, withLocationToken(options)),
  };
}
