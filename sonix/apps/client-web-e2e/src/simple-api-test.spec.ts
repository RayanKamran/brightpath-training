import {expect, test} from '@playwright/test';
import {authenticateUser} from './helpers/auth.helper';

test('simple API call test after authentication', async ({page}) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(`${msg.type()}: ${text}`);
    console.log(`CONSOLE ${msg.type()}:`, text);
  });

  // Capture page errors
  page.on('pageerror', (err) => {
    console.log('PAGE ERROR:', err.message);
  });

  // Authenticate first
  await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');

  console.log('Authentication complete, current URL:', page.url());

  // Navigate directly to customers page
  console.log('Navigating to /customers...');
  const response = await page.goto('/customers', {waitUntil: 'load', timeout: 10000});

  console.log('Response status:', response?.status());
  console.log('Current URL after navigation:', page.url());

  // Wait a bit for any initial rendering
  await page.waitForTimeout(5000);

  // Log all console messages
  console.log('\n=== CONSOLE MESSAGES ===');
  for (const msg of consoleMessages) {
    console.log(msg);
  }
  console.log('=== END CONSOLE MESSAGES ===\n');

  // Take screenshot
  await page.screenshot({path: 'test-output/simple-test.png', fullPage: true});

  // Try to get page content
  const bodyText = await page.locator('body').textContent();
  console.log('Page text content (first 500 chars):', bodyText?.substring(0, 500));

  // Check for any errors on page
  const errorText = await page.locator('[role="alert"], .error, .MuiAlert-root').allTextContents();
  console.log('Error messages on page:', errorText);

  // Check if we're still authenticated
  const url = page.url();
  console.log('Final URL:', url);

  // The test passes if we're not redirected to sign-in
  expect(url).not.toContain('/sign-in');
});
