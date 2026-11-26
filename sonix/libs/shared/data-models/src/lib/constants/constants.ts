export const APP_BASE_URL = 'http://localhost:3004';
export const API_BASE_URL = 'http://localhost:3000';
export const API_TEST_HTTP = 'api-test.http';
export const API_TEST_HTTP_EXAMPLE = 'api-test.http.example';

// Windows has no /bin/bash; use the bash on PATH (Git Bash) there.
export const BIN_BASH_PATH = process.platform === 'win32' ? 'bash' : '/bin/bash';

export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE = 1;

export const LOGTO_BASE_URL = 'http://localhost:3001';

export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 3000;

export const TEST_USER_EMAIL = 'alice@acme-rv.com';
export const TEST_USER_PASSWORD = 'xyab12dE';
