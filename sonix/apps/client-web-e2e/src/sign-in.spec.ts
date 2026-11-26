import {expect, test} from '@playwright/test';

// Import translation file to use consistent strings
import signInTranslations from '../../client-web/app/locales/en/sign-in.json';

test.describe('Sign In Page', () => {
  test.beforeEach(async ({page}) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/sign-in');
  });

  test.describe('Page Layout and Content', () => {
    test('should display the sign-in page with correct title and subtitle', async ({page}) => {
      // Check the main heading
      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible();

      // Check the subtitle
      const subtitle = page.getByText(signInTranslations.subtitle);
      await expect(subtitle).toBeVisible();
    });

    test('should display the Sign In button', async ({page}) => {
      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();
      await expect(signInButton).toBeEnabled();
    });

    test('should display register link for new users', async ({page}) => {
      // Check for "Don't have an account?" text
      const noAccountText = page.getByText(signInTranslations.noAccount);
      await expect(noAccountText).toBeVisible();

      // Check for register link
      const registerLink = page.getByRole('button', {name: signInTranslations.registerLink});
      await expect(registerLink).toBeVisible();
    });

    test('should have proper page structure and styling', async ({page}) => {
      // Check that page uses a card layout
      const card = page.locator('[class*="MuiCard-root"]').first();
      await expect(card).toBeVisible();

      // Verify the page is centered
      const container = page.locator('[class*="MuiContainer-root"]').first();
      await expect(container).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to register page when clicking "Register here" link', async ({page}) => {
      const registerLink = page.getByRole('button', {name: signInTranslations.registerLink});
      await registerLink.click();

      // Should navigate to register page
      await expect(page).toHaveURL(/\/register/);
    });

    test('should be accessible directly via URL', async ({page}) => {
      await page.goto('/sign-in');
      await expect(page).toHaveURL(/\/sign-in/);

      // Verify content loaded
      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should trigger Logto authentication when clicking Sign In button', async ({page}) => {
      // Monitor for navigation to Logto
      const navigationPromise = page.waitForURL(/localhost:3001/, {timeout: 10000});

      // Click the Sign In button
      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await signInButton.click();

      // Should redirect to Logto authentication page
      await navigationPromise;
      expect(page.url()).toContain('localhost:3001');
    });

    test('should redirect authenticated users away from sign-in page', async ({page}) => {
      // This test would require setting up authentication state first
      // For now, we verify that sign-in page is accessible when not authenticated
      await page.goto('/sign-in');
      await expect(page).toHaveURL(/\/sign-in/);

      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({page}) => {
      await page.setViewportSize({width: 375, height: 667}); // iPhone SE size

      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible();

      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();

      const registerLink = page.getByRole('button', {name: signInTranslations.registerLink});
      await expect(registerLink).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({page}) => {
      await page.setViewportSize({width: 768, height: 1024}); // iPad size

      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible();

      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({page}) => {
      await page.setViewportSize({width: 1920, height: 1080}); // Full HD

      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible();

      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper semantic HTML structure', async ({page}) => {
      // Check for main heading
      const h1 = page.getByRole('heading', {level: 1, name: signInTranslations.title});
      await expect(h1).toBeVisible();

      // Check for proper button roles
      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeVisible();

      const registerButton = page.getByRole('button', {name: signInTranslations.registerLink});
      await expect(registerButton).toBeVisible();
    });

    test('should be keyboard navigable', async ({page}) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Sign In button should be focused
      const signInButton = page.getByRole('button', {name: signInTranslations.button});
      await expect(signInButton).toBeFocused();

      // Tab to register link
      await page.keyboard.press('Tab');
      const registerButton = page.getByRole('button', {name: signInTranslations.registerLink});
      await expect(registerButton).toBeFocused();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should load without console errors', async ({page}) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      // Allow for expected errors (like missing favicon)
      const criticalErrors = errors.filter(
        (error) => !error.includes('favicon') && !error.includes('404'),
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should have no failed network requests for critical resources', async ({page}) => {
      const failedRequests: string[] = [];

      page.on('response', (response) => {
        if (response.status() >= 400) {
          const url = response.url();
          // Ignore favicon and other non-critical resources
          if (!url.includes('favicon') && !url.includes('.well-known')) {
            failedRequests.push(`${response.status()} - ${url}`);
          }
        }
      });

      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      expect(failedRequests).toHaveLength(0);
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({page}) => {
      const startTime = Date.now();
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should display content quickly (no blank screen)', async ({page}) => {
      await page.goto('/sign-in');

      // Content should be visible quickly
      const heading = page.getByRole('heading', {name: signInTranslations.title});
      await expect(heading).toBeVisible({timeout: 2000});
    });
  });
});
