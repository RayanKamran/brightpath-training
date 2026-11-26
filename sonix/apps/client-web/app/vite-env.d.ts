/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_LOGTO_ENDPOINT: string;
  readonly VITE_LOGTO_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
