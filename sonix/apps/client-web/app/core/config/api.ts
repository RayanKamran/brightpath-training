import {getRequiredEnv} from './env';

export const API_CONFIG = {
  baseUrl: getRequiredEnv('VITE_API_URL'),
  resourceIdentifier: getRequiredEnv('VITE_API_URL'),
  get healthUrl() {
    return `${this.baseUrl}/SystemHealth/ping`;
  },
  timeoutMs: 30_000,
} as const;
