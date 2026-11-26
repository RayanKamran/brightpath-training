import {getRequiredEnv} from './env';

export const AUTH_CONFIG = {
  endpoint: getRequiredEnv('VITE_LOGTO_ENDPOINT'),
  appId: getRequiredEnv('VITE_LOGTO_APP_ID'),
  get callbackUri() {
    return `${window.location.origin}/callback`;
  },
  get signOutUri() {
    return `${window.location.origin}/`;
  },
} as const;
