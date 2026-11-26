import {expect, test} from '@playwright/test';
import {authenticateUser} from './helpers/auth.helper';

test.describe('Debug Authentication', () => {
  test('should complete authentication flow', async ({page}) => {
    console.log('=== Starting authentication debug test ===');

    // Enable console logging from the page
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    try {
      console.log('Step 1: Calling authenticateUser...');
      await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');

      console.log('Step 2: Authentication completed!');
      console.log('Current URL:', page.url());

      // Wait a bit to see final state
      await page.waitForTimeout(2000);

      console.log('Step 3: Taking screenshot...');
      await page.screenshot({path: 'test-output/after-auth.png', fullPage: true});

      console.log('Step 4: Trying to navigate to /customers...');
      await page.goto('/customers');

      console.log('Step 5: Waiting for page load...');
      await page.waitForLoadState('networkidle');
      console.log('Current URL after goto:', page.url());

      // Take another screenshot
      await page.screenshot({path: 'test-output/customers-page.png', fullPage: true});

      // Check if we see a heading
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      console.log('Headings on page:', headings);

      // Check page title
      const title = await page.title();
      console.log('Page title:', title);

      // Success if we got this far
      expect(page.url()).toContain('customers');
    } catch (error) {
      console.error('=== Authentication failed! ===');
      console.error('Error:', error);
      console.error('Current URL:', page.url());

      // Take error screenshot
      await page.screenshot({path: 'test-output/auth-error.png', fullPage: true});

      throw error;
    }
  });
});
