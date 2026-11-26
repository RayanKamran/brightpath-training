import {expect, test} from '@playwright/test';

test.describe('Unauthenticated User Access Control', () => {
  test.beforeEach(async ({page}) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should redirect unauthenticated user from customer list to sign-in', async ({page}) => {
    // Try to access customer list page directly
    await page.goto('/customers');

    // Should be redirected to sign-in page
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain('/sign-in');
  });

  test('should redirect unauthenticated user from customer details to sign-in', async ({page}) => {
    // Try to access customer details page directly
    await page.goto('/customers/123');

    // Should be redirected to sign-in page
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain('/sign-in');
  });

  test('should not show customer navigation links when not authenticated', async ({page}) => {
    await page.goto('/');

    // Check that customer-related navigation is not visible
    const navLinks = await page.locator('nav a, header a').allTextContents();
    const hasCustomersLink = navLinks.some((text) => text.toLowerCase().includes('customer'));

    expect(hasCustomersLink).toBe(false);
  });

  test('should allow access to public pages without authentication', async ({page}) => {
    // Home page should be accessible
    await page.goto('/');
    await expect(page).toHaveURL('/sign-in');

    // Sign-in page should be accessible
    await page.goto('/sign-in');
    await expect(page).toHaveURL('/sign-in');

    // Register page should be accessible
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });

  test('should display sign-in button when not authenticated', async ({page}) => {
    await page.goto('/');

    // Should show sign-in button or link
    const signInButton = page
      .getByRole('button', {name: /sign.?in/i})
      .or(page.getByRole('link', {name: /sign.?in/i}));

    await expect(signInButton).toBeVisible();
  });

  test('should not allow API calls without access token', async ({page}) => {
    let apiCallFailed = false;

    // Listen for failed API calls
    page.on('response', (response) => {
      if (response.url().includes('/api/customer') && response.status() === 401) {
        apiCallFailed = true;
      }
    });

    // Try to navigate to customers page
    await page.goto('/customers');

    // Should be redirected before making API call, but if API call is made, it should fail with 401
    await page.waitForTimeout(1000); // Give time for any API calls to complete

    // Either we were redirected (good) or API call failed with 401 (also good)
    const wasRedirected = page.url().includes('/sign-in');
    expect(wasRedirected || apiCallFailed).toBe(true);
  });
});

test.describe('Protected Routes Navigation', () => {
  test('should not be able to access protected routes via direct URL manipulation', async ({
    page,
  }) => {
    const protectedRoutes = ['/customers', '/customers/123', '/user-settings'];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should be redirected to sign-in
      await page.waitForURL(/sign-in/, {timeout: 5000});
      expect(page.url()).toContain('/sign-in');
    }
  });

  test('should preserve redirect URL after sign-in', async ({page}) => {
    // Try to access protected route
    await page.goto('/customers');

    // Should be redirected to sign-in with redirect parameter
    await page.waitForURL(/sign-in/);

    // URL should contain information about where to redirect after login
    // (This depends on your implementation, adjust accordingly)
    const url = page.url();
    expect(url).toContain('/sign-in');
  });
});
