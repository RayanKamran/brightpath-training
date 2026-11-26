# Quick Start: Using authenticateUser() with Logto

## What It Does

The `authenticateUser()` function automates the entire Logto OAuth sign-in flow:

1. Navigates to your `/sign-in` page
2. Clicks the "Sign In" button
3. Waits for Logto's hosted sign-in form (on localhost:3001)
4. Fills in email/username
5. Fills in password
6. Handles both single-step and multi-step sign-in flows
7. Submits the form
8. Waits for OAuth callback to complete
9. Waits for redirect to home page

## Basic Usage

```typescript
import { test } from '@playwright/test';
import { authenticateUser } from './helpers/auth.helper';

test.describe('My Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // This runs before each test and handles the entire login flow
    await authenticateUser(page, 'mike@acme-rv.com', 'xyab12dE');
  });

  test('should access protected page', async ({ page }) => {
    // User is already authenticated!
    await page.goto('/customers');
    // ... your test assertions
  });
});
```

## Your Current Setup

Your `customer-pages.spec.ts` is already configured correctly:

```typescript
import {authenticateUser} from './helpers/auth.helper';

test.describe('Customer List Page (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'mike@acme-rv.com', 'xyab12dE');
  });
  // ... tests run with authenticated user
});
```

## Running the Tests

```bash
# Run all customer page tests
nx e2e client-web-e2e --grep customer-pages

# Or with Playwright directly
npx playwright test src/customer-pages.spec.ts

# Run in headed mode to see the authentication flow
npx playwright test src/customer-pages.spec.ts --headed

# Debug a specific test
npx playwright test src/customer-pages.spec.ts --debug
```

## Troubleshooting

### If authentication fails:

1. **Run in headed mode** to see what's happening:
   ```bash
   npx playwright test --headed --debug
   ```

2. **Check Logto is running**:
   ```bash
   docker-compose ps
   # Logto should be on localhost:3001
   ```

3. **Verify credentials** - make sure the user exists in Logto:
   - Open http://localhost:3002 (Logto Admin Console)
   - Check Users section
   - Create test user if needed

4. **Update selectors** if Logto UI has changed:
   - Edit `apps/client-web-e2e/src/helpers/auth.helper.ts`
   - The helper uses flexible selectors that work with most Logto versions
   - See the comments in the file for alternative selectors

### If tests are slow:

Consider using **global authentication** (authenticate once, reuse for all tests):
- See `apps/client-web-e2e/src/helpers/README.md` for setup instructions
- This can speed up your test suite significantly

## What's Different from Traditional Auth

With traditional username/password forms, you can directly fill form fields on your app. 

With Logto (OAuth/OIDC):
- Sign-in happens on Logto's domain (localhost:3001), not your app
- Your app redirects to Logto, then Logto redirects back with tokens
- The `authenticateUser()` helper handles this entire OAuth flow automatically

## Next Steps

Your tests are ready to run! Just execute:

```bash
nx e2e client-web-e2e
```

All 18 new customer page tests will run with authenticated users.
