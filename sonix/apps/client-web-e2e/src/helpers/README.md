# Authentication Helper for Playwright Tests

## Overview

The `authenticateUser()` function automates Logto's OAuth sign-in flow in Playwright tests.

## Usage

```typescript
import { authenticateUser } from './helpers/auth.helper';

test.beforeEach(async ({ page }) => {
  await authenticateUser(page, 'user@example.com', 'password123');
});
```

## Important Notes

### 1. Logto Form Field Selectors

The helper uses generic selectors that should work with most Logto configurations:
- `input[name="identifier"]` or `input[type="email"]` for username/email
- `input[name="password"]` or `input[type="password"]` for password
- `button[type="submit"]` for the submit button

**If authentication fails**, you may need to adjust these selectors based on your Logto version and configuration. To find the correct selectors:

1. Run Playwright in headed mode: `npx playwright test --headed --debug`
2. Inspect Logto's sign-in form to see the actual field names and structure
3. Update the selectors in `auth.helper.ts` accordingly

### 2. Logto Sign-In Flow

Logto may use different sign-in flows depending on your configuration:
- **Username/Password**: Single page with both fields
- **Identifier First**: Email on first page, then password on second page
- **Social Sign-In**: Additional OAuth provider buttons

The current helper assumes a simple username/password flow. If your Logto uses a multi-step flow:

```typescript
// Example for identifier-first flow:
await emailInput.fill(email);
await page.click('button:has-text("Continue")');
await page.waitForSelector('input[type="password"]');
await passwordInput.fill(password);
await page.click('button[type="submit"]');
```

### 3. Alternative: Reuse Authentication State

For faster test execution, authenticate once and reuse the session across tests:

**Create a global setup file** (`apps/client-web-e2e/src/global-setup.ts`):

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { authenticateUser } from './helpers/auth.helper';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Authenticate once
  await authenticateUser(page, 'test@example.com', 'password');
  
  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  
  await browser.close();
}

export default globalSetup;
```

**Update `playwright.config.ts`**:

```typescript
export default defineConfig({
  globalSetup: './src/global-setup.ts',
  use: {
    storageState: 'playwright/.auth/user.json',
  },
});
```

This approach authenticates once per test run instead of before each test, significantly speeding up your test suite.

### 4. Environment Variables

For security, store test credentials in environment variables:

```typescript
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'defaultPassword';

await authenticateUser(page, TEST_EMAIL, TEST_PASSWORD);
```

Add to `.env.local` (and add to `.gitignore`):
```
TEST_USER_EMAIL=mike@acme-rv.com
TEST_USER_PASSWORD=xyab12dE
```

## Troubleshooting

### Authentication Timing Issues

If tests fail with timeout errors, you may need to increase timeouts or add more specific waits:

```typescript
// Wait for specific element after login
await page.waitForSelector('text=Welcome', { timeout: 10000 });
```

### Logto UI Changes

If Logto updates its UI, the selectors may break. Use Playwright's `codegen` to generate updated selectors:

```bash
npx playwright codegen http://localhost:3004/sign-in
```

### Debug Mode

Run tests with debugging to see exactly what's happening:

```bash
npx playwright test --debug customer-pages.spec.ts
```
