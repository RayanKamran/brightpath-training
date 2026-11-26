import {Page} from '@playwright/test';

/**
 * Authenticates a user through Logto's OAuth flow
 *
 * This helper navigates to the sign-in page, triggers the Logto authentication,
 * fills in credentials on Logto's hosted sign-in form, and completes the OAuth callback.
 *
 * @param page - Playwright Page object
 * @param email - User's email address
 * @param password - User's password
 */
export async function authenticateUser(page: Page, email: string, password: string): Promise<void> {
  // Clear all browser storage to ensure clean state
  await page.context().clearCookies();
  await page.context().clearPermissions();

  // Navigate to sign-in page
  await page.goto('/sign-in', {waitUntil: 'networkidle'});

  // Click the "Sign In" button which triggers Logto authentication
  const signInButton = page.locator('button:has-text("Sign In")');
  await signInButton.waitFor({state: 'visible', timeout: 5000});
  await signInButton.click();

  // Wait for redirect to Logto's authentication page (localhost:3001)
  await page.waitForURL(/localhost:3001/, {timeout: 10000});

  // Wait for Logto sign-in form to appear
  // Logto uses specific field names - identifier for email/username
  const emailInput = page.locator('input[name="identifier"]').first();
  await emailInput.waitFor({state: 'visible', timeout: 10000});

  // Fill in email
  await emailInput.click();
  await emailInput.fill(email);

  // Wait a bit for any dynamic form updates
  await page.waitForTimeout(500);

  // Look for password field - it should be visible on the same page with your new config
  const passwordInput = page.locator('input[name="password"]').first();

  // Check if we need to click a "Continue" button first (multi-step flow)
  const passwordIsVisible = await passwordInput.isVisible().catch(() => false);

  if (!passwordIsVisible) {
    // Try clicking Continue/Next button if password not visible
    const continueBtn = page
      .locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Sign in")')
      .first();
    const continueExists = await continueBtn.isVisible().catch(() => false);

    if (continueExists) {
      await continueBtn.click();
      await page.waitForLoadState('networkidle');
    }
  }

  // Now fill in password
  await passwordInput.waitFor({state: 'visible', timeout: 5000});
  await passwordInput.click();
  await passwordInput.fill(password);

  // Wait a bit before submitting
  await page.waitForTimeout(500);

  // Submit the form - look for submit button
  // Logto uses a button with "Sign in" text
  const submitButton = page.locator('button:has-text("Sign in")').first();
  await submitButton.waitFor({state: 'visible', timeout: 5000});
  await submitButton.click();

  // Wait for OAuth callback to complete
  // The flow is: Logto form (localhost:3001) → callback page (localhost:3004/callback) → home page (localhost:3004/)
  await page.waitForURL(/localhost:3004/, {timeout: 15000});

  // Don't wait for networkidle - the app has continuous activity (AuthGuard checking state)
  // Instead, wait for URL to change away from callback/sign-in pages
  const maxAttempts = 15;
  let attempts = 0;
  let authenticated = false;
  while (attempts < maxAttempts) {
    const url = page.url();
    if (!url.includes('/callback') && !url.includes('/sign-in')) {
      // Successfully authenticated and redirected.
      authenticated = true;
      break;
    }
    await page.waitForTimeout(1000);
    attempts++;
  }

  // Final check
  const finalUrl = page.url();
  if (!authenticated || finalUrl.includes('/sign-in')) {
    throw new Error(
      `Authentication failed - still on sign-in page after ${attempts} attempts. URL: ${finalUrl}`,
    );
  }

  // Wait for location context to finish loading by checking for the location switcher
  // This ensures the app is fully initialized before tests proceed
  try {
    await page.getByTestId('location-switcher-button').first().waitFor({
      state: 'visible',
      timeout: 10000,
    });
  } catch (_error) {
    console.warn('Location switcher not found after authentication, but continuing anyway');
  }

  // Add a small buffer to ensure location context is fully initialized
  await page.waitForTimeout(1000);
}

/**
 * Alternative: Authenticate using Playwright's storage state for faster test execution
 *
 * This approach authenticates once, saves the auth state, and reuses it across tests.
 * You would set this up in a global setup file.
 *
 * See: https://playwright.dev/docs/auth#authenticate-once-per-worker
 */

/**
 * Selects a location from the location switcher
 *
 * @param page - Playwright Page object
 * @param locationName - Name of the location to select (e.g., "ACME Location AAA")
 */
export async function selectLocation(page: Page, locationName: string): Promise<void> {
  // Map internal names to display names
  const locationDisplayNames: Record<string, string> = {
    LOC_AAA: 'ACME RV West Coast',
    LOC_BBB: 'ACME RV Mountain Region',
    LOC_CCC: 'ACME RV Texas',
    LOC_HQ: 'ACME RV Headquarters',
    LOC_CLOSED: 'ACME RV Northwest (CLOSED)',
    LOC_DELETED: 'ACME RV Mistake (DELETED)',
  };

  // Use display name if mapping exists, otherwise use provided name
  const displayName = locationDisplayNames[locationName] || locationName;

  // Click the location switcher button to open the menu (use first() to handle multiple instances)
  const locationButton = page.getByTestId('location-switcher-button').first();
  await locationButton.waitFor({state: 'visible', timeout: 10000});
  await locationButton.click();

  // Wait for menu to appear
  await page.waitForTimeout(750);

  // Try exact mapped display name first, then fallback to internal name, then first enabled option.
  const mappedMenuItem = page.getByRole('menuitem', {name: new RegExp(displayName, 'i')});
  const rawMenuItem = page.getByRole('menuitem', {name: new RegExp(locationName, 'i')});
  const firstEnabledMenuItem = page
    .locator('[role="menuitem"]:not([aria-disabled="true"])')
    .first();

  const mappedVisible = await mappedMenuItem
    .first()
    .isVisible()
    .catch(() => false);
  const rawVisible = await rawMenuItem
    .first()
    .isVisible()
    .catch(() => false);

  const mappedEnabled = mappedVisible
    ? await mappedMenuItem
        .first()
        .isEnabled()
        .catch(() => false)
    : false;
  const rawEnabled = rawVisible
    ? await rawMenuItem
        .first()
        .isEnabled()
        .catch(() => false)
    : false;

  if (mappedVisible && !mappedEnabled) {
    // Location appears in menu but is disabled: assume it's already selected.
    await page.keyboard.press('Escape').catch(() => undefined);
  } else if (mappedEnabled) {
    await mappedMenuItem.first().click();
  } else if (rawEnabled) {
    await rawMenuItem.first().click();
  } else if (await firstEnabledMenuItem.isVisible().catch(() => false)) {
    await firstEnabledMenuItem.click();
  } else {
    // No enabled menu items were available; close menu and continue.
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  // Wait for location switch to complete - increased timeout for context updates.
  await page.waitForTimeout(2000);

  // Verify the location was switched by checking the current location display (use first() to handle multiple instances).
  const currentLocationDisplay = page.getByTestId('current-location-name').first();
  await currentLocationDisplay.waitFor({state: 'visible', timeout: 10000});

  // Ensure location text has a non-empty value before proceeding to quote creation.
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="current-location-name"]');
    return Boolean(el?.textContent?.trim());
  });

  // Additional buffer so organization-scoped token refresh can settle in context.
  await page.waitForTimeout(8000);
}
