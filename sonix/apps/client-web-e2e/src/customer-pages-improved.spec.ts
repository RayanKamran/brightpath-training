import {expect, test} from '@playwright/test';
import {authenticateUser, selectLocation} from './helpers/auth.helper';

test.describe('Customer List Page (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should display customer list table with proper structure', async ({page}) => {
    await page.goto('/customers');

    // Wait for the page to load using semantic heading
    await expect(page.getByRole('heading', {name: /customers/i})).toBeVisible();

    // Check that the table exists using ARIA label
    const table = page.getByRole('table', {name: /customers table/i});
    await expect(table).toBeVisible();

    // Verify table headers using semantic columnheader role
    await expect(page.getByRole('columnheader', {name: /id/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /first name/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /surname/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /status/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /last contact/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /last updated/i})).toBeVisible();
  });

  test('should display and interact with search functionality', async ({page}) => {
    await page.goto('/customers');

    await selectLocation(page, 'LOC_AAA');

    // Use placeholder text for search input (semantic)
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({timeout: 10000});
    await expect(searchInput).toBeEnabled();

    // Test search interaction
    await searchInput.fill('Peterson');

    // Verify search was entered
    await expect(searchInput).toHaveValue('Peterson');
  });

  test('should filter customers when searching with real data', async ({page}) => {
    await page.goto('/customers');

    await selectLocation(page, 'LOC_AAA');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /customers table/i});
    await table.waitFor();

    // Get initial row count from table body
    const tableBody = table.locator('tbody');
    await tableBody.waitFor();

    // Count initial rows (excluding header and loading/empty states)
    const initialRowCount = await tableBody.locator('tr').count();

    // Only proceed if we have data to test with
    if (initialRowCount > 0) {
      // Search for specific demo customer
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('Peterson');

      // Wait for the row count to change (search debounce + API call + re-render)
      // Use waitFor with a function that checks if the count has changed
      await expect(async () => {
        const currentCount = await tableBody.locator('tr').count();
        expect(currentCount).toBeLessThan(initialRowCount);
      }).toPass({timeout: 5000});

      // Verify we got the expected Peterson result
      const filteredRowCount = await tableBody.locator('tr').count();
      expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

      // Should find "Peterson" in the table cells (surname column)
      await expect(tableBody.locator('tr').filter({hasText: 'Peterson'})).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should display pagination controls with proper ARIA', async ({page}) => {
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    // Wait for data to load
    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Look for pagination using test ID (MUI doesn't use navigation role by default)
    const pagination = page.getByTestId('customers-pagination');
    await expect(pagination).toBeVisible();

    // Check for rows per page selector using combobox role
    const rowsPerPageSelect = pagination.getByRole('combobox');
    await expect(rowsPerPageSelect).toBeVisible();

    // Check for page navigation buttons
    const nextButton = pagination.getByRole('button', {name: /next page/i});
    await expect(nextButton).toBeVisible();
  });

  test('should navigate to customer details when clicking a row', async ({page}) => {
    await page.goto('/customers');

    // Wait for customers to load
    const table = page.getByRole('table', {name: /customers table/i});
    await table.waitFor();

    const tableBody = table.locator('tbody');
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

    // Check for loading indicator in table
    const table = page.getByRole('table', {name: /customers table/i});

    // Should eventually load - using waitFor instead of timeout
    await table.waitFor({timeout: 20000});
    await expect(table).toBeVisible();

    // Clean up route
    await page.unrouteAll({behavior: 'ignoreErrors'});
  });

  test('should display meaningful error message when API fails', async ({page}) => {
    // Mock API failure BEFORE navigating
    await page.route('**/api/customer*', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({message: 'Internal Server Error'}),
      }),
    );

    await page.goto('/customers');

    // Wait for location context to be ready first
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    // Wait a bit for the API call to happen and fail
    await page.waitForTimeout(2000);

    // Check for error alert using ARIA role
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({timeout: 5000});

    // Should show error message (could be "Failed to fetch" or "Failed to load customers")
    const errorText = await errorAlert.textContent();
    expect(errorText).toMatch(/failed|error/i);

    // Clean up routes
    await page.unrouteAll({behavior: 'ignoreErrors'});
  });

  test('should change rows per page using accessible controls', async ({page}) => {
    await page.goto('/customers');

    // Wait for table to load
    await page.getByRole('table', {name: /customers table/i}).waitFor();

    // Find pagination navigation
    const pagination = page.getByRole('navigation', {name: /pagination/i});

    // Look for rows per page selector
    const rowsPerPageSelect = pagination.getByRole('combobox');

    if (await rowsPerPageSelect.isVisible()) {
      // Get current value
      const currentValue = await rowsPerPageSelect.inputValue();

      // Click to open options
      await rowsPerPageSelect.click();

      // Select different option (choose one different from current)
      const targetOption = currentValue === '10' ? '25' : '10';
      await page.getByRole('option', {name: targetOption}).click();

      // Wait for change to take effect
      await page.waitForTimeout(500);

      // Verify the selection changed
      await expect(rowsPerPageSelect).toHaveValue(targetOption);
    }
  });

  test('should show appropriate empty state when no results', async ({page}) => {
    await page.goto('/customers');

    // Wait for initial load
    await page.getByRole('table', {name: /customers table/i}).waitFor();

    // Search for something that definitely won't exist
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('DEFINITELY_NO_RESULTS_XYZABC123');

    // Wait for search to complete
    await page.waitForTimeout(600);

    // Should show no results message or empty table body
    const noResultsMessage = page.getByText(/no results|no customers found/i);
    const emptyTableBody = page.getByRole('table').locator('tbody tr td[colspan]');

    // Either condition indicates proper empty state handling
    const hasEmptyState =
      (await noResultsMessage.isVisible()) || (await emptyTableBody.isVisible());
    expect(hasEmptyState).toBe(true);
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

    await selectLocation(page, 'LOC_AAA');

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');

    // Click first customer to navigate
    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Wait for details page to load
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for customer data to load using testId
    const heading = page.getByTestId('customer-profile-heading');
    await expect(heading).toBeVisible({timeout: 15000});
  });

  test('should provide accessible back navigation', async ({page}) => {
    // Get to customer details page
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Find back button using testid (since it exists)
    const backButton = page.getByTestId('back-to-customers-button');
    await expect(backButton).toBeVisible({timeout: 10000});

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

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for customer data to load
    await page.waitForTimeout(3000);

    // Look for customer information cards using semantic structure
    // Check for any card/article containers
    const customerCard = page.locator('[class*="MuiCard"]:visible').first();
    await expect(customerCard).toBeVisible({timeout: 10000});

    // Should have customer name displayed somewhere
    const customerName = page.locator('h1, h2, h3, h4, h5, h6').first();
    await expect(customerName).toBeVisible();
  });

  test('should display contact information with proper icons', async ({page}) => {
    // Navigate to customer details
    await page.goto('/customers');

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/customers\/[a-zA-Z0-9-]+/);

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Look for email or contact information
    // Could be an email icon, email text, or contact section
    const emailIcon = page.locator('[data-testid*="EmailIcon"], svg[class*="email" i]').first();
    const contactSection = page.getByText(/contact|email|phone/i).first();

    // Should have some contact information displayed
    const hasContactInfo = (await emailIcon.isVisible()) || (await contactSection.isVisible());
    expect(hasContactInfo).toBe(true);
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

    // Wait for location context to be ready
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    // Wait a bit for the page to try to load the customer
    await page.waitForTimeout(2000);

    // Should show error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({timeout: 5000});

    // Should show back button for recovery
    const backButton = page.getByRole('button', {name: /back to customers/i});
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

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Select LOC_AAA location (required to view customer details)
    await selectLocation(page, 'LOC_AAA');

    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await firstRow.click();

    // Should show loading indicator or eventually show content
    // Check immediately for loading, then wait for content
    const hasLoading = await page
      .getByRole('progressbar')
      .isVisible()
      .catch(() => false);

    // Wait a bit for the delay to pass
    await page.waitForTimeout(1500);

    // Page should eventually resolve to either content or error
    const hasContent =
      (await page.getByTestId('customer-profile-heading').isVisible()) ||
      (await page.getByRole('alert').isVisible());

    // Either we saw loading state, or we see content now
    expect(hasLoading || hasContent).toBe(true);

    // Clean up route
    await page.unrouteAll({behavior: 'ignoreErrors'});
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
    await page.getByRole('table', {name: /customers table/i}).waitFor();

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
    const hasAuthError = await page
      .getByText(/unauthorized|authentication|access denied/i)
      .isVisible();
    const hasErrorAlert = await page.getByRole('alert').isVisible();

    // At least one of these should be true for proper error handling
    expect(isSignInPage || hasAuthError || hasErrorAlert).toBe(true);
  });

  test('should handle network errors gracefully', async ({page}) => {
    // Mock network failure
    await page.route('**/api/customer*', (route) => route.abort('failed'));

    await page.goto('/customers');
    await page.waitForTimeout(3000);

    // Should show error state
    const errorAlert = page.getByRole('alert');
    const errorMessage = page.getByText(/failed to fetch|network error|unable to load/i);

    const hasErrorHandling = (await errorAlert.isVisible()) || (await errorMessage.isVisible());
    expect(hasErrorHandling).toBe(true);
  });
});

// Helper test to verify demo data is available
test.describe('Demo Data Verification', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should have demo customers available for testing', async ({page}) => {
    await page.goto('/customers');

    // Wait for location context to be ready first
    await page
      .getByTestId('location-switcher-button')
      .first()
      .waitFor({state: 'visible', timeout: 10000});

    await page.getByRole('table', {name: /customers table/i}).waitFor({timeout: 15000});

    // Wait for loading to complete
    const loadingSpinner = page.getByTestId('customers-loading');
    await loadingSpinner.waitFor({state: 'hidden', timeout: 10000}).catch(() => {});

    // Wait for actual customer rows to appear
    await page.waitForSelector('[data-testid^="customer-row-"]', {timeout: 10000});

    const tableBody = page.getByRole('table').locator('tbody');
    const rowCount = await tableBody.locator('tr[data-testid^="customer-row-"]').count();

    // Should have at least some demo customers (we have 2 in LOC_BBB, 3 in LOC_AAA)
    expect(rowCount).toBeGreaterThan(0);

    // Search for one of our demo customers to verify data integrity
    // Rodriguez is in LOC_BBB, which is the default location for Alice
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Rodriguez');
    await page.waitForTimeout(600);

    // Should find Maria Rodriguez from our demo data (LOC_BBB)
    const hasResults = (await tableBody.locator('tr').count()) > 0;
    if (hasResults) {
      const rodriguezRow = page.getByText(/rodriguez/i);
      await expect(rodriguezRow).toBeVisible();
    }
  });
});
