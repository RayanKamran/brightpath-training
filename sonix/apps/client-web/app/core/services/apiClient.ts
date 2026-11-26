import {API_CONFIG} from '../config/api';
import type {ProblemDetailDto} from '../config/apiErrors';
import {
  ApiError,
  NetworkOfflineError,
  RequestTimeoutError,
  ServerUnreachableError,
} from '../config/apiErrors';
import {networkMonitor} from './networkMonitor';

export type RequestOptions = {
  signal?: AbortSignal;
  token?: string | null;
  refreshToken?: () => Promise<string | null>;
};

class ApiClient {
  public async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'GET'}, options);
  }

  public async post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'POST', body: JSON.stringify(body)}, options);
  }

  public async patch<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'PATCH', body: JSON.stringify(body)}, options);
  }

  public async put<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'PUT', body: JSON.stringify(body)}, options);
  }

  public async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'DELETE'}, options);
  }

  public async postForm<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {method: 'POST', body: formData}, options);
  }

  private async request<T>(url: string, init: RequestInit, options?: RequestOptions): Promise<T> {
    if (!networkMonitor.isOnline()) {
      throw new NetworkOfflineError();
    }

    const token = options?.token ?? null;
    const refreshToken = options?.refreshToken ?? null;

    const controller = new AbortController();
    const abort = controller.abort.bind(controller);
    const callerSignal = options?.signal;

    // Forward caller abort to our controller
    callerSignal?.addEventListener('abort', abort, {once: true});

    const timeoutId = setTimeout(abort, API_CONFIG.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchWithAuth(url, {...init, signal: controller.signal}, token);
    } catch (error) {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener('abort', abort);

      if (error instanceof DOMException && error.name === 'AbortError') {
        networkMonitor.checkHealth();
        throw new RequestTimeoutError();
      }
      if (error instanceof TypeError) {
        networkMonitor.reportServerUnreachable();
        throw new ServerUnreachableError();
      }
      throw error;
    }

    // On 401, attempt a single token refresh and retry
    if (response.status === 401 && refreshToken) {
      const newToken = await refreshToken();
      if (newToken) {
        try {
          response = await this.fetchWithAuth(url, {...init, signal: controller.signal}, newToken);
        } catch (error) {
          clearTimeout(timeoutId);
          callerSignal?.removeEventListener('abort', abort);

          if (error instanceof DOMException && error.name === 'AbortError') {
            networkMonitor.checkHealth();
            throw new RequestTimeoutError();
          }
          if (error instanceof TypeError) {
            networkMonitor.reportServerUnreachable();
            throw new ServerUnreachableError();
          }
          throw error;
        }
      }
    }

    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abort);

    return this.handleResponse<T>(response);
  }

  private fetchWithAuth(url: string, init: RequestInit, token: string | null): Promise<Response> {
    const isFormData = init.body instanceof FormData;
    return fetch(url, {
      ...init,
      headers: {
        ...(init.body != null && !isFormData ? {'Content-Type': 'application/json'} : {}),
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
    });
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/problem+json')) {
      const problem: ProblemDetailDto = await response.json();
      throw new ApiError(problem);
    }

    throw new ApiError({
      title: response.statusText,
      status: response.status,
      detail: `HTTP ${response.status}: ${response.statusText}`,
    });
  }
}

export const apiClient = new ApiClient();
