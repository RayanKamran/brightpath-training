#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Sync Logto Organizations to DMS Database Locations
 *
 * This script uses M2M credentials to authenticate and call the
 * location sync endpoint, which synchronizes all Logto Organizations
 * into the DMS database as Location records.
 *
 * Usage:
 *   npm run sync:locations
 *   tsx scripts/sync-locations.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  BLUE,
  GREEN,
  NC,
  RED,
  YELLOW,
} from '../libs/shared/data-models/src/lib/constants/console-colors.js';

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type SyncResponse = {
  success: boolean;
  synced: number;
  failed: number;
  message: string;
};

/**
 * Load environment variables from .env file
 */
const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#'))
      .forEach((line) => {
        const m = line.match(/^(\w+)=(.*)$/);
        if (m) {
          // strip quotes if present
          if (m[2].startsWith('"') && m[2].endsWith('"')) {
            m[2] = m[2].slice(1, -1);
          } else if (m[2].startsWith("'") && m[2].endsWith("'")) {
            m[2] = m[2].slice(1, -1);
          }
          process.env[m[1]] = m[2];
        }
      });
  }
};

/**
 * Get M2M access token from Logto
 * For M2M apps accessing Management API, no resource parameter is needed
 */
const getM2MToken = async (
  logtoEndpoint: string,
  appId: string,
  appSecret: string,
): Promise<string> => {
  const tokenUrl = `${logtoEndpoint}/oidc/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: appId,
    client_secret: appSecret,
    resource: 'https://default.logto.app/api',
    scope: 'all',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.access_token) {
      throw new Error('No access token in response');
    }

    return data.access_token;
  } catch (error) {
    console.error(`${RED}Failed to get M2M token:${NC}`, error);
    throw error;
  }
};

/**
 * Call the location sync endpoint
 */
const syncLocations = async (apiEndpoint: string, accessToken: string): Promise<SyncResponse> => {
  const syncUrl = `${apiEndpoint}/api/locations/sync/from-logto`;

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as SyncResponse;
    return data;
  } catch (error) {
    console.error(`${RED}Failed to sync locations:${NC}`, error);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  console.log(`${BLUE}╔════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${BLUE}║  Sync Logto Organizations → DMS Database Locations        ║${NC}`);
  console.log(`${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n`);

  // Load environment variables
  loadEnv();

  // Get configuration from environment
  const API_PORT = process.env.DMS_SONIX_APIS_PORT || 3000;
  const API_ENDPOINT = `http://localhost:${API_PORT}`;
  const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID || '';
  const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET || '';
  const LOGTO_ENDPOINT =
    process.env.LOGTO_ENDPOINT || process.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3001';

  // Validate required configuration
  if (!M2M_APP_ID || !M2M_APP_SECRET) {
    console.error(`${RED}Error: M2M credentials not found in .env file${NC}`);
    console.error(`${YELLOW}Required environment variables:${NC}`);
    console.error(`  LOGTO_M2M_APP_ID`);
    console.error(`  LOGTO_M2M_APP_SECRET`);
    console.error(`\n${YELLOW}Please update your .env file with M2M credentials${NC}\n`);
    process.exit(1);
  }

  console.log(`${BLUE}Configuration:${NC}`);
  console.log(`  Logto Endpoint: ${LOGTO_ENDPOINT}`);
  console.log(`  API Endpoint:   ${API_ENDPOINT}`);
  console.log(`  M2M App ID:     ${M2M_APP_ID}`);
  console.log('');

  try {
    // Step 1: Get M2M access token
    console.log(`${BLUE}[1/2]${NC} Getting M2M access token...`);
    const accessToken = await getM2MToken(LOGTO_ENDPOINT, M2M_APP_ID, M2M_APP_SECRET);
    console.log(`${GREEN}✓${NC} Access token obtained\n`);

    // Step 2: Call sync endpoint
    console.log(`${BLUE}[2/2]${NC} Syncing locations from Logto...`);
    const result = await syncLocations(API_ENDPOINT, accessToken);

    console.log(`${GREEN}✓${NC} Sync complete\n`);
    console.log(`${GREEN}Results:${NC}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Synced:  ${result.synced}`);
    console.log(`  Failed:  ${result.failed}`);
    console.log(`  Message: ${result.message}\n`);

    if (result.failed > 0) {
      console.log(`${YELLOW}Warning: Some locations failed to sync${NC}`);
      console.log(`${YELLOW}Check server logs for details${NC}\n`);
      process.exit(1);
    }

    console.log(`${GREEN}🎉 Location sync completed successfully!${NC}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${RED}✗ Sync failed${NC}\n`);
    if (error instanceof Error) {
      console.error(`${RED}Error: ${error.message}${NC}\n`);
    }
    process.exit(1);
  }
};

// Run the script
main().catch((error) => {
  console.error(`${RED}Unhandled error:${NC}`, error);
  process.exit(1);
});
