#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Sync Logto Organizations → DMS Locations AND Logto Users → DMS Users
 *
 * This script uses M2M credentials to authenticate and call both sync
 * endpoints, keeping DMS Database in sync with Logto as the source of truth.
 *
 * Usage:
 *   npm run logto:sync
 *   tsx scripts/sync-from-logto.ts
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

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
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
};

/**
 * Call a sync endpoint and return the result
 */
const callSync = async (url: string, accessToken: string): Promise<SyncResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync request failed (${url}): ${response.status} ${errorText}`);
  }

  return (await response.json()) as SyncResponse;
};

/**
 * Main execution
 */
const main = async () => {
  console.log(`${BLUE}╔════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${BLUE}║  Sync Logto → DMS Database (Locations + Users)            ║${NC}`);
  console.log(`${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n`);

  loadEnv();

  const API_PORT = process.env.DMS_SONIX_APIS_PORT || 3000;
  const API_ENDPOINT = `http://localhost:${API_PORT}`;
  const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID || '';
  const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET || '';
  const LOGTO_ENDPOINT =
    process.env.LOGTO_ENDPOINT || process.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3001';

  if (!M2M_APP_ID || !M2M_APP_SECRET) {
    console.error(`${RED}Error: M2M credentials not found in .env file${NC}`);
    console.error(`${YELLOW}Required environment variables:${NC}`);
    console.error(`  LOGTO_M2M_APP_ID`);
    console.error(`  LOGTO_M2M_APP_SECRET`);
    process.exit(1);
  }

  console.log(`${BLUE}Configuration:${NC}`);
  console.log(`  Logto Endpoint: ${LOGTO_ENDPOINT}`);
  console.log(`  API Endpoint:   ${API_ENDPOINT}`);
  console.log(`  M2M App ID:     ${M2M_APP_ID}`);
  console.log('');

  try {
    console.log(`${BLUE}[1/3]${NC} Getting M2M access token...`);
    const accessToken = await getM2MToken(LOGTO_ENDPOINT, M2M_APP_ID, M2M_APP_SECRET);
    console.log(`${GREEN}✓${NC} Access token obtained\n`);

    console.log(`${BLUE}[2/3]${NC} Syncing locations from Logto...`);
    const locationsResult = await callSync(
      `${API_ENDPOINT}/api/locations/sync/from-logto`,
      accessToken,
    );
    console.log(`${GREEN}✓${NC} Locations sync complete`);
    console.log(`  Synced: ${locationsResult.synced}  Failed: ${locationsResult.failed}\n`);

    console.log(`${BLUE}[3/3]${NC} Syncing users from Logto...`);
    const usersResult = await callSync(`${API_ENDPOINT}/api/user/sync/from-logto`, accessToken);
    console.log(`${GREEN}✓${NC} Users sync complete`);
    console.log(`  Synced: ${usersResult.synced}  Failed: ${usersResult.failed}\n`);

    const anyFailed = locationsResult.failed > 0 || usersResult.failed > 0;
    if (anyFailed) {
      console.log(
        `${YELLOW}Warning: Some records failed to sync. Check server logs for details.${NC}\n`,
      );
      process.exit(1);
    }

    console.log(`${GREEN}🎉 Sync completed successfully!${NC}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${RED}✗ Sync failed${NC}\n`);
    if (error instanceof Error) {
      console.error(`${RED}Error: ${error.message}${NC}`);
      const cause = (error as NodeJS.ErrnoException & {cause?: unknown}).cause;
      if (cause instanceof Error) {
        console.error(`${RED}Cause: ${cause.message}${NC}`);
      }
      console.error('');
    }
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(`${RED}Unhandled error:${NC}`, error);
  process.exit(1);
});
