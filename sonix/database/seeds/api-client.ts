/**
 * HTTP client utilities for API-based seeding
 * Makes requests to the NestJS APIs for entity creation with M2M authentication
 */

interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

interface LogtoTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Base URL for the API server
 * Default to localhost:3000, can be overridden via env var
 */
const API_BASE_URL = process.env.DMS_API_URL || 'http://localhost:3000';

/**
 * Get Logto configuration for M2M authentication
 * Lazy-loaded to ensure environment variables are loaded first
 */
const getLogtoConfig = () => {
  return {
    endpoint: process.env.LOGTO_ENDPOINT || 'http://localhost:3001',
    appId: process.env.LOGTO_M2M_APP_ID || '',
    appSecret: process.env.LOGTO_M2M_APP_SECRET || '',
    apiResource: process.env.LOGTO_API_RESOURCE || 'http://localhost:3000/api',
  };
};

// Cache the access token to avoid repeated token requests
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Get M2M access token from Logto
 * Uses client_credentials grant type with the API resource
 */
const getM2MAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (cachedAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }

  const config = getLogtoConfig();

  // Validate credentials are present
  if (!config.appId || !config.appSecret) {
    throw new Error(
      'Missing M2M credentials:\n' +
        `LOGTO_M2M_APP_ID: ${config.appId ? 'present' : 'MISSING'}\n` +
        `LOGTO_M2M_APP_SECRET: ${config.appSecret ? 'present' : 'MISSING'}\n` +
        'Please check your .env file',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    resource: config.apiResource,
    scope: 'all',
  });

  // Logto expects client credentials via HTTP Basic Authentication
  const credentials = Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64');

  try {
    const response = await fetch(`${config.endpoint}/oidc/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch {
        errorDetails = await response.text();
      }
      throw new Error(
        `Failed to get access token: ${response.status} ${response.statusText}\n` +
          `Logto endpoint: ${config.endpoint}\n` +
          `API resource: ${config.apiResource}\n` +
          `Response: ${errorDetails}\n\n` +
          `Troubleshooting:\n` +
          `1. Ensure Logto is running: docker ps | grep logto\n` +
          `2. Verify M2M credentials in .env match Logto configuration\n` +
          `3. Check that the M2M app has access to the API resource`,
      );
    }

    const json = (await response.json()) as LogtoTokenResponse;

    if (!json.access_token) {
      throw new Error('Access token not found in response');
    }

    cachedAccessToken = json.access_token;
    // Set expiry time to 90% of the actual expiry to ensure we refresh before it expires
    const expiresIn = json.expires_in || 3600; // Default to 1 hour
    tokenExpiryTime = Date.now() + expiresIn * 1000 * 0.9;

    return cachedAccessToken;
  } catch (error) {
    throw new Error(
      `Failed to obtain M2M access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * Make an authenticated HTTP request to the API
 * Uses M2M access token from Logto for authentication
 */
export const apiRequest = async <T = unknown>(
  options: ApiRequestOptions,
): Promise<ApiResponse<T>> => {
  const {method, url, body, headers = {}} = options;

  try {
    // Get M2M access token
    const accessToken = await getM2MAccessToken();

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        error: data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * POST request helper
 */
export const apiPost = async <T = unknown>(url: string, body: unknown): Promise<ApiResponse<T>> => {
  return apiRequest<T>({method: 'POST', url, body});
};

/**
 * PATCH request helper
 */
export const apiPatch = async <T = unknown>(
  url: string,
  body: unknown,
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({method: 'PATCH', url, body});
};

/**
 * GET request helper
 */
export const apiGet = async <T = unknown>(url: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>({method: 'GET', url});
};

/**
 * Check if the API server is available
 * Uses the locations endpoint as a health check
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/locations`);
    // Accept 200 (OK) or 401 (Unauthorized) - both mean the server is up
    return response.status === 200 || response.status === 401;
  } catch {
    return false;
  }
};

/**
 * Wait for API server to be ready
 * Polls the health endpoint with exponential backoff
 */
export const waitForApi = async (maxRetries = 10, initialDelay = 1000): Promise<void> => {
  let retries = 0;
  let delay = initialDelay;

  console.log(`⏳ Waiting for API server at ${API_BASE_URL}...`);

  while (retries < maxRetries) {
    const isHealthy = await checkApiHealth();
    if (isHealthy) {
      console.log('✅ API server is ready\n');
      return;
    }

    retries++;

    if (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10s
    }
  }

  throw new Error(
    `\n❌ API server not available after ${maxRetries} attempts.\n\n` +
      `Please ensure the API server is running on ${API_BASE_URL}\n` +
      `Start the API server with: npm run dev:apis\n`,
  );
};
