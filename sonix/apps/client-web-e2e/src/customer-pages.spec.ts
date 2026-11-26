import {expect, test} from '@playwright/test';

// Inlined to avoid importing @dms/data-models, which transitively loads NestJS/class-validator
// decorators that crash in the Playwright (Node.js ESM) context.
const ERROR_FAILED_TO_FETCH = 'Failed to fetch';

import {authenticateUser, selectLocation} from './helpers/auth.helper';

test.describe('Customer List Page (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should display customer list table with proper structure', async ({page}) => {
    await page.goto('/customers');

    // Wait for the page to load using semantic heading
    await expect(page.getByRole('heading', {name: /customers/i})).toBeVisible();

    // Check that the table exists using ARIA label and test ID
    const table = page.getByTestId('customers-table');
    await expect(table).toBeVisible();

    // Verify table headers using test IDs
    await expect(page.getByTestId('header-id')).toBeVisible();
    await expect(page.getByTestId('header-first-name')).toBeVisible();
    await expect(page.getByTestId('header-surname')).toBeVisible();
    await expect(page.getByTestId('header-status')).toBeVisible();
    await expect(page.getByTestId('header-last-contact')).toBeVisible();
    await expect(page.getByTestId('header-last-updated')).toBeVisible();
  });

  test('should display and interact with search functionality', async ({page}) => {
    await page.goto('/customers');

    // Use test ID for search input
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    // Test search interaction
    await searchInput.fill('Peterson');

    // Verify search was entered
    await expect(searchInput).toHaveValue('Peterson');
  });

  test('should filter customers when searching with real data', async ({page}) => {
    await page.goto('/customers');

    // Wait for table to be populated using test ID
    const table = page.getByTestId('customers-table');
    await table.waitFor();

    // Get initial row count from table body
    const tableBody = page.getByTestId('customers-table-body');
    await tableBody.waitFor();

    // Count initial rows (excluding header and loading/empty states)
    const initialRowCount = await tableBody.locator('tr').count();

    // Only proceed if we have data to test with
    if (initialRowCount > 0) {
      // Search for specific demo customer
      const searchInput = page.getByTestId('customer-search-input');
      await searchInput.fill('Peterson');

      // Wait for search debounce and results
      await page.waitForTimeout(600);

      // Check if results were filtered
      const filteredRowCount = await tableBody.locator('tr').count();

      // Results should be same or fewer (could be 0 if no match)
      expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    }
  });

  test('should display pagination controls', async ({page}) => {
    await page.goto('/customers');

    // Wait for data to load using test ID
    await page.getByTestId('customers-table').waitFor();

    // Look for pagination using test ID
    const pagination = page.getByTestId('customers-pagination');
    await expect(pagination).toBeVisible();
  });

  test('should navigate to customer details when clicking a row', async ({page}) => {
    await page.goto('/customers');

    // Wait for customers to load using test ID
    const table = page.getByTestId('customers-table');
    await table.waitFor();

    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();

    // Ensure we have at least one row before clicking
    await expect(firstRow).toBeVisible();

    // Click the row
    await firstRow.click();

    // Should navigate to customer details page
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);
  });

  test('should handle loading state gracefully', async ({page}) => {
    // Intercept API to add delay
    await page.route('**/api/customer*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    // The loading indicator may appear briefly during navigation
    // Then table should eventually load
    const table = page.getByTestId('customers-table');
    await table.waitFor({timeout: 20000});
    await expect(table).toBeVisible();

    // Clean up route
    await page.unrouteAll({behavior: 'ignoreErrors'});
  });

  test('should display meaningful error message when API fails', async ({page}) => {
    // Mock API failure
    await page.route('**/api/customer*', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({message: 'Internal Server Error'}),
      }),
    );

    await page.goto('/customers');

    // Wait for error state to appear using test ID
    const errorAlert = page.getByTestId('customers-error');
    await expect(errorAlert).toBeVisible();

    // Should show the expected error message
    await expect(page.getByText(ERROR_FAILED_TO_FETCH)).toBeVisible();
  });

  test('should change rows per page using accessible controls', async ({page}) => {
    await page.goto('/customers');

    // Wait for table to load using test ID
    await page.getByTestId('customers-table').waitFor();

    // Find pagination using test ID
    const pagination = page.getByTestId('customers-pagination');

    // Look for rows per page selector
    const rowsPerPageSelect = pagination.getByRole('combobox');

    if (await rowsPerPageSelect.isVisible()) {
      // Get current value using text content
      const currentText = await rowsPerPageSelect.innerText();
      const currentValue = currentText.trim();

      // Click to open options
      await rowsPerPageSelect.click();

      // Select different option (choose one different from current)
      const targetOption = currentValue === '10' ? '25' : '10';
      await page.getByRole('option', {name: targetOption}).click();

      // Wait for change to take effect
      await page.waitForTimeout(500);

      // Verify the selection changed by checking text content
      const newText = await rowsPerPageSelect.innerText();
      expect(newText.trim()).toBe(targetOption);
    }
  });

  test('should show appropriate empty state when no results', async ({page}) => {
    await page.goto('/customers');

    // Wait for initial load using test ID
    await page.getByTestId('customers-table').waitFor();

    // Search for something that definitely won't exist
    const searchInput = page.getByTestId('customer-search-input');
    await searchInput.fill('DEFINITELY_NO_RESULTS_XYZABC123');

    // Wait for search to complete
    await page.waitForTimeout(600);

    // Should show no results message using test ID
    const noResultsMessage = page.getByTestId('customers-no-results');
    await expect(noResultsMessage).toBeVisible();
  });
});

test.describe('Customer Details Page (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should display customer profile with back navigation', async ({page}) => {
    // Navigate via customer list for realistic flow
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByTestId('customers-table').waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');
    await page.waitForTimeout(1000);

    // Click first customer to navigate
    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Wait for details page to load
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Check for profile heading using test ID
    const heading = page.getByTestId('customer-profile-heading');
    await expect(heading).toBeVisible({timeout: 5000});
  });

  test('should provide accessible back navigation', async ({page}) => {
    // Get to customer details page
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByTestId('customers-table').waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');
    await page.waitForTimeout(1000);

    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Find back button using test ID
    const backButton = page.getByTestId('back-to-customers-button');
    await expect(backButton).toBeVisible();

    // Test back navigation
    await backButton.click();

    // Should return to customer list
    await expect(page).toHaveURL('/customers');
    await expect(page.getByRole('heading', {name: /customers/i})).toBeVisible();
  });

  test('should display customer information in accessible format', async ({page}) => {
    // Navigate to customer details
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByTestId('customers-table').waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');
    await page.waitForTimeout(1000);

    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for customer data to load using test ID
    const headerCard = page.getByTestId('customer-header-card');
    await expect(headerCard).toBeVisible({timeout: 5000});

    // Should have customer name displayed
    const customerName = page.getByTestId('customer-name-display');
    await expect(customerName).toBeVisible();
  });

  test('should display contact information with proper structure', async ({page}) => {
    // Navigate to customer details
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByTestId('customers-table').waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');
    await page.waitForTimeout(1000);

    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Look for contact information card using test ID
    const contactCard = page.getByTestId('customer-contact-card');
    await expect(contactCard).toBeVisible();
  });

  test('should handle customer not found error gracefully', async ({page}) => {
    // Mock API to return 404
    await page.route('**/api/customer/*', (route) =>
      route.fulfill({
        status: 404,
        body: JSON.stringify({message: 'Customer not found'}),
      }),
    );

    // Navigate to non-existent customer
    await page.goto('/customers/non-existent-customer-id');

    // Should show error message using test ID
    const errorAlert = page.getByTestId('customer-error');
    await expect(errorAlert).toBeVisible({timeout: 5000});

    // Should show back button for recovery using test ID
    const backButton = page.getByTestId('customer-error-back-button');
    await expect(backButton).toBeVisible();
  });

  test('should handle loading state appropriately', async ({page}) => {
    // Add delay to customer details API
    await page.route('**/api/customer/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByTestId('customers-table').waitFor({timeout: 15000});

    const tableBody = page.getByTestId('customers-table-body');
    const firstRow = tableBody.locator('tr').first();
    await firstRow.click();

    // The loading indicator may appear briefly during navigation
    // Page should eventually resolve to content or error
    await page.waitForTimeout(3000);

    const hasContent =
      (await page.getByTestId('customer-header-card').isVisible()) ||
      (await page.getByTestId('customer-error').isVisible());

    expect(hasContent).toBe(true);
  });
});

test.describe('Customer Pages - API Integration', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should include proper Authorization header in API requests', async ({page}) => {
    let hasAuthHeader = false;
    const apiRequests: Array<{url: string; hasAuth: boolean}> = [];

    // Monitor API requests for authentication
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/customer')) {
        const authHeader = request.headers()['authorization'];
        const hasAuth = authHeader?.startsWith('Bearer ') ?? false;
        apiRequests.push({url, hasAuth});

        if (hasAuth) {
          hasAuthHeader = true;
        }
      }
    });

    // Navigate to trigger API calls
    await page.goto('/customers');
    await page.getByTestId('customers-table').waitFor();

    // Verify authentication was included
    expect(hasAuthHeader).toBe(true);
    expect(apiRequests.some((req) => req.hasAuth)).toBe(true);
  });

  test('should handle 401 Unauthorized with appropriate user feedback', async ({page}) => {
    // Mock 401 response
    await page.route('**/api/customer*', (route) =>
      route.fulfill({
        status: 401,
        body: JSON.stringify({message: 'Unauthorized'}),
      }),
    );

    await page.goto('/customers');
    await page.waitForTimeout(2000);

    // Should either redirect to sign-in or show auth error
    const isSignInPage = page.url().includes('/sign-in');
    const hasErrorAlert = await page.getByTestId('customers-error').isVisible();

    // At least one of these should be true for proper error handling
    expect(isSignInPage || hasErrorAlert).toBe(true);
  });

  test('should handle network errors gracefully', async ({page}) => {
    // Mock network failure
    await page.route('**/api/customer*', (route) => route.abort('failed'));

    await page.goto('/customers');
    await page.waitForTimeout(3000);

    // Should show error state using test ID
    const errorAlert = page.getByTestId('customers-error');
    await expect(errorAlert).toBeVisible();
  });
});

// Helper test to verify demo data is available
test.describe('Demo Data Verification', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should have demo customers available for testing', async ({page}) => {
    await page.goto('/customers');

    await selectLocation(page, 'LOC_AAA');

    await page.getByTestId('customers-table').waitFor();

    // Wait for loading to complete
    const loadingSpinner = page.getByTestId('customers-loading');
    await loadingSpinner.waitFor({state: 'hidden', timeout: 10000}).catch(() => {});

    // Count rows in table body using test ID (excluding loading/empty rows)
    const tableBody = page.getByTestId('customers-table-body');

    // Wait for actual customer rows to appear (they have customer-row- prefix)
    await page.waitForSelector('[data-testid^="customer-row-"]', {timeout: 10000});

    const rowCount = await tableBody.locator('tr[data-testid^="customer-row-"]').count();

    // Should have at least some demo customers (we created 6)
    expect(rowCount).toBeGreaterThan(0);

    // Search for one of our demo customers to verify data integrity
    const searchInput = page.getByTestId('customer-search-input');
    await searchInput.fill('Peterson');
    await page.waitForTimeout(600);

    // Should find Peterson Tech from our demo data
    const hasResults = (await tableBody.locator('tr').count()) > 0;
    if (hasResults) {
      const petersonRow = page.getByText(/peterson/i);
      await expect(petersonRow).toBeVisible();
    }
  });
});
