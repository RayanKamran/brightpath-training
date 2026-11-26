/**
 * Shared authentication helper for testing scripts and E2E tests
 *
 * This module provides Playwright-based authentication for Logto OAuth flow.
 * Used by:
 * - scripts/get-api-token.ts
 * - scripts/test-api-automated.ts
 * - apps/sonix-apis-e2e (future)
 */

import {type Browser, type BrowserContext, chromium, Locator, type Page} from 'playwright';

const LOGTO_BASE_URL = /localhost:3001/;
const APP_BASE_URL = /localhost:3004/;

export interface AuthConfig {
  appBaseUrl: string;
  testUser: {
    email: string;
    password: string;
  };
}

/**
 * Authenticates with Logto using headless browser automation
 * Extracts and returns the access token
 */
export async function authenticateWithPlaywright(config: AuthConfig): Promise<string> {
  let browser: Browser | undefined;
  let accessToken = '';

  try {
    browser = await chromium.launch({headless: true});
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    // Navigate to sign-in page
    await page.goto(`${config.appBaseUrl}/sign-in`, {waitUntil: 'networkidle'});

    // Click the "Sign In" button
    const signInButton: Locator = page.locator('button:has-text("Sign In")');
    await signInButton.waitFor({state: 'visible', timeout: 5000});
    await signInButton.click();

    await page.waitForURL(LOGTO_BASE_URL, {timeout: 10000});

    const emailInput: Locator = page.locator('input[name="identifier"]').first();
    await emailInput.waitFor({state: 'visible', timeout: 10000});
    await emailInput.fill(config.testUser.email);

    const passwordInput: Locator = page.locator('input[name="password"]').first();
    const passwordIsVisible = await passwordInput.isVisible().catch(() => false);

    if (!passwordIsVisible) {
      // Multi-step flow - click continue first
      const continueBtn: Locator = page
        .locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Sign in")')
        .first();
      const continueExists = await continueBtn.isVisible().catch(() => false);

      if (continueExists) {
        await continueBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Fill password
    await passwordInput.waitFor({state: 'visible', timeout: 5000});
    await passwordInput.fill(config.testUser.password);

    // Submit the form
    const submitButton: Locator = page.locator('button:has-text("Sign in")').first();
    await submitButton.waitFor({state: 'visible', timeout: 5000});
    await submitButton.click();

    await page.waitForURL(APP_BASE_URL, {timeout: 15000});

    // Wait for authentication to complete using event-driven approach
    await page
      .waitForURL(
        (url) => !url.toString().includes('/callback') && !url.toString().includes('/sign-in'),
        {timeout: 15000},
      )
      .catch(() => {
        // Timeout acceptable - continue to token extraction
      });

    accessToken = await getAccessToken(page);

    if (!accessToken) {
      // Alternative: Use Logto SDK's getAccessToken by injecting code
      accessToken = await page.evaluate(async () => {
        // @ts-expect-error - accessing window object in browser context
        if (window.logto && typeof window.logto.getAccessToken === 'function') {
          try {
            // @ts-expect-error
            return await window.logto.getAccessToken();
          } catch {
            return '';
          }
        }
        return '';
      });
    }

    if (!accessToken) {
      throw new Error('Could not extract access token from browser session');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return accessToken;
}

async function getAccessToken(page: Page): Promise<string> {
  return await page.evaluate(() => {
    // Get the access token from localStorage or sessionStorage
    const storageKeys: string[] = Object.keys(localStorage);
    for (const key of storageKeys) {
      const value: string | null = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.accessToken) {
            return parsed.accessToken;
          }
          if (parsed.access_token) {
            return parsed.access_token;
          }
          if (parsed.idToken) {
            return parsed.idToken;
          }
          if (parsed.token) {
            return parsed.token;
          }
        } catch {
          // Not JSON, might be the token itself
          if (value.startsWith('eyJ')) {
            return value;
          }
        }
      }
    }

    // If not found in localStorage, check sessionStorage
    const sessionKeys: string[] = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      const value: string | null = sessionStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.accessToken) {
            return parsed.accessToken;
          }
          if (parsed.access_token) {
            return parsed.access_token;
          }
        } catch {
          if (value.startsWith('eyJ')) {
            return value;
          }
        }
      }
    }

    return '';
  });
}
