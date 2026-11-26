/**
 * API Configuration
 * Centralized configuration for API endpoints and resources
 */

export const API_CONFIG = {
  /**
   * Base URL for the API server
   */
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

  /**
   * API Resource Identifier for Logto
   * This MUST match the API Resource configured in Logto Admin Console
   */
  resourceIdentifier: 'http://localhost:3000/api',
} as const;
