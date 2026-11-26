#!/usr/bin/env tsx

/**
 * Token Fetcher - Gets access token and updates api-test.http
 *
 * This script:
 * 1. Uses headless browser to automate login (you won't see any browser)
 * 2. Extracts the access token
 * 3. Updates the @token variable in api-test.http
 *
 * Usage:
 *   npm run api:get-token
 *
 * Then use api-test.http normally - no manual token copying needed!
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  API_BASE_URL,
  API_TEST_HTTP,
  API_TEST_HTTP_EXAMPLE,
  APP_BASE_URL,
  LOGTO_BASE_URL,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from '@dms/data-models';
import {type AuthConfig, authenticateWithPlaywright} from '@dms/testing-helpers';

const authConfig: AuthConfig = {
  appBaseUrl: APP_BASE_URL,
  testUser: {
    email: process.env.TEST_USER_EMAIL || TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD || TEST_USER_PASSWORD,
  },
};

async function ServicesRunningVerification(): Promise<void> {
  console.log('🔍 Checking if required services are running...\n');

  await VerifyFrontEndServiceRunning();
  await VerifyBackendServiceRunning();
  await VerifyLogtoServiceRunning();

  console.log('\n   All services are running! Proceeding...\n');
}

async function VerifyFrontEndServiceRunning(): Promise<void> {
  try {
    const frontendResponse = await fetch(APP_BASE_URL, {method: 'HEAD'});
    if (frontendResponse.ok || frontendResponse.status === 404) {
      console.log('   ✅ Frontend (client-web) is running on :3004');
    }
  } catch {
    console.error('   ❌ Frontend (client-web) is NOT running on :3004\n');
    console.log('Please start the frontend first:');
    console.log('   npm run dev:web\n');
    console.log('Or start everything:');
    console.log('   npm run docker:up      # Start Docker services');
    console.log('   npm run dev:apis       # Start backend APIs');
    console.log('   npm run dev:web        # Start frontend\n');
    process.exit(1);
  }
}

async function VerifyBackendServiceRunning(): Promise<void> {
  try {
    const apiResponse = await fetch(`${API_BASE_URL}/api/SystemHealth/ping`);
    if (apiResponse.ok) {
      console.log('   ✅ Backend API is running on :3000');
    }
  } catch {
    console.error('   ❌ Backend API is NOT running on :3000\n');
    console.log('Please start the backend first:');
    console.log('   npm run dev:apis\n');
    process.exit(1);
  }
}

async function VerifyLogtoServiceRunning(): Promise<void> {
  try {
    const logtoResponse = await fetch(LOGTO_BASE_URL, {method: 'HEAD'});
    if (logtoResponse.ok || logtoResponse.status === 404) {
      console.log('   ✅ Logto is running on :3001');
    }
  } catch {
    console.error('   ❌ Logto is NOT running on :3001\n');
    console.log('Please start Docker services:');
    console.log('   npm run docker:up\n');
    process.exit(1);
  }

  console.log('\n   All services are running! Proceeding...\n');
}

function updateHttpFile(token: string): void {
  const httpFilePath: string = path.join(process.cwd(), API_TEST_HTTP);
  const exampleFilePath: string = path.join(process.cwd(), API_TEST_HTTP_EXAMPLE);

  // If api-test.http doesn't exist, create it from the example template
  if (!fs.existsSync(httpFilePath)) {
    if (!fs.existsSync(exampleFilePath)) {
      console.error('❌ Neither api-test.http nor api-test.http.example found!');
      console.log('\nPlease restore api-test.http.example from the repository.\n');
      process.exit(1);
    }

    console.log('📋 Creating api-test.http from template...');
    fs.copyFileSync(exampleFilePath, httpFilePath);
    console.log('✅ Created api-test.http\n');
  }

  let content: string = fs.readFileSync(httpFilePath, 'utf-8');

  // Replace the @token variable line
  const tokenLineRegex = /^@token = .+$/m;
  if (tokenLineRegex.test(content)) {
    content = content.replace(tokenLineRegex, `@token = ${token}`);
  } else {
    console.error('❌ Could not find @token variable in api-test.http');
    process.exit(1);
  }

  fs.writeFileSync(httpFilePath, content, 'utf-8');
}

async function getLocationId(token: string): Promise<string | null> {
  try {
    const apiBaseUrl: string = process.env.API_URL || API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/api/locations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const locations = await response.json();
    if (Array.isArray(locations) && locations.length > 0) {
      return locations[0].id;
    }

    return null;
  } catch {
    return null;
  }
}

function updateLocationId(locationId: string): void {
  const httpFilePath: string = path.join(process.cwd(), API_TEST_HTTP);

  if (!fs.existsSync(httpFilePath)) {
    return;
  }

  let content: string = fs.readFileSync(httpFilePath, 'utf-8');

  // Replace the @locationId variable line
  const locationIdRegex = /^@locationId = .+$/m;
  if (locationIdRegex.test(content)) {
    content = content.replace(locationIdRegex, `@locationId = ${locationId}`);
    fs.writeFileSync(httpFilePath, content, 'utf-8');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Token Fetcher for api-test.http');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Check if all required services are running
    await ServicesRunningVerification();

    console.log('🔐 Fetching access token...');
    console.log(`   User: ${authConfig.testUser.email}`);
    console.log("   Running headless browser (you won't see anything)...\n");

    const token: string = await authenticateWithPlaywright(authConfig);

    console.log('✅ Token retrieved successfully!\n');
    console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...\n`);

    updateHttpFile(token);

    console.log('✅ Updated api-test.http with new token!\n');

    // Try to get and update locationId
    console.log('🔍 Fetching location ID...');
    const locationId: string | null = await getLocationId(token);

    if (locationId) {
      updateLocationId(locationId);
      console.log(`✅ Updated locationId: ${locationId}\n`);
    } else {
      console.log('⚠️  Could not fetch location ID. You may need to set it manually.\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('  You can now use api-test.http');
    console.log('  Just click "Send Request" on any endpoint!');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Failed to fetch token:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
