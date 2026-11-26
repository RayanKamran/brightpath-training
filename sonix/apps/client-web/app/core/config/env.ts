type EnvKey = 'VITE_API_URL' | 'VITE_LOGTO_ENDPOINT' | 'VITE_LOGTO_APP_ID';

export function getRequiredEnv(name: EnvKey): string {
  const value = import.meta.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Define it in apps/client-web/.env (or mode-specific .env file).`,
    );
  }

  return value.replace(/\/+$/, '');
}
