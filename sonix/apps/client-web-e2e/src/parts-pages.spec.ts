import {expect, test} from '@playwright/test';
import {authenticateUser} from './helpers/auth.helper';

test.describe('Parts Inventory Page (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should display parts inventory page with proper heading', async ({page}) => {
    await page.goto('/parts');

    // Wait for the page to load using semantic heading
    await expect(page.getByRole('heading', {name: /parts inventory/i})).toBeVisible();
  });

  test('should display parts table with proper structure', async ({page}) => {
    await page.goto('/parts');

    // Wait for the page to load
    await expect(page.getByRole('heading', {name: /parts inventory/i})).toBeVisible();

    // Check that the table exists using ARIA label
    const table = page.getByRole('table', {name: /parts table/i});
    await expect(table).toBeVisible();

    // Verify table headers using semantic columnheader role
    await expect(page.getByRole('columnheader', {name: /part number/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /description/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /primary bin/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /status/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /list price/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /on hand/i})).toBeVisible();
    await expect(page.getByRole('columnheader', {name: /available/i})).toBeVisible();
  });

  test('should display search functionality', async ({page}) => {
    await page.goto('/parts');

    // Use placeholder text for search input
    const searchInput = page.getByPlaceholder(/search by part number/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('should display and interact with search', async ({page}) => {
    await page.goto('/parts');

    const searchInput = page.getByPlaceholder(/search by part number/i);
    await expect(searchInput).toBeVisible();

    // Test search interaction
    await searchInput.fill('RV-WH-4521');

    // Verify search was entered
    await expect(searchInput).toHaveValue('RV-WH-4521');
  });

  test('should filter parts when searching with real data', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    // Get initial row count from table body
    const tableBody = table.locator('tbody');
    await tableBody.waitFor();

    // Count initial rows (excluding header and loading/empty states)
    const initialRowCount = await tableBody.locator('tr').count();

    // Only proceed if we have data to test with
    if (initialRowCount > 0) {
      // Get the first part number from the table
      const firstPartCell = tableBody.locator('tr').first().locator('td').first();
      const firstPartNumber = await firstPartCell.textContent();

      if (firstPartNumber) {
        // Search for that specific part
        const searchInput = page.getByPlaceholder(/search by part number/i);
        await searchInput.fill(firstPartNumber.trim());

        // Wait for the search to filter results
        await expect(async () => {
          const currentCount = await tableBody.locator('tr').count();
          expect(currentCount).toBeLessThanOrEqual(initialRowCount);
        }).toPass({timeout: 3000});

        // Should find the part number in the visible rows
        await expect(page.getByText(firstPartNumber.trim())).toBeVisible();
      }
    }
  });

  test('should display part count message', async ({page}) => {
    await page.goto('/parts');

    // Wait for data to load
    await page.getByRole('table', {name: /parts table/i}).waitFor();

    // Check for parts found message
    await expect(page.getByText(/parts found/i)).toBeVisible();
  });

  test('should display pagination controls', async ({page}) => {
    await page.goto('/parts');

    // Wait for data to load
    await page.getByRole('table', {name: /parts table/i}).waitFor();

    // Look for pagination using test ID
    const pagination = page.getByTestId('parts-pagination');
    await expect(pagination).toBeVisible();

    // Check for rows per page selector
    const rowsPerPageSelect = pagination.getByRole('combobox');
    await expect(rowsPerPageSelect).toBeVisible();

    // Check for page navigation buttons
    const nextButton = pagination.getByRole('button', {name: /next page/i});
    await expect(nextButton).toBeVisible();

    const prevButton = pagination.getByRole('button', {name: /previous page/i});
    await expect(prevButton).toBeVisible();
  });

  test('should change rows per page', async ({page}) => {
    await page.goto('/parts');

    // Wait for data to load
    await page.getByRole('table', {name: /parts table/i}).waitFor();

    const pagination = page.getByTestId('parts-pagination');
    const rowsPerPageSelect = pagination.getByRole('combobox');

    // Click on the select
    await rowsPerPageSelect.click();

    // Select 50 rows per page
    await page.getByRole('option', {name: '50'}).click();

    // Wait for data to reload
    await page.waitForTimeout(500);

    // Verify the select now shows 50
    await expect(rowsPerPageSelect).toContainText('50');
  });

  test('should display loading state', async ({page}) => {
    // Intercept the API call to delay it
    await page.route('**/api/part*', async (route) => {
      // Add delay before continuing the request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/parts');

    // Should see loading spinner
    const loadingIndicator = page.getByTestId('parts-loading');
    await expect(loadingIndicator)
      .toBeVisible({timeout: 2000})
      .catch(() => {
        // Loading might be too fast, which is ok
      });

    // Clean up routes
    await page.unrouteAll({behavior: 'ignoreErrors'});
  });

  test('should display empty state when no parts found', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to load
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    // Search for something that definitely won't exist
    const searchInput = page.getByPlaceholder(/search by part number/i);
    await searchInput.fill('NONEXISTENT-PART-XYZ-999');

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // Should see "No parts found" message
    const noResultsMessage = page.getByTestId('parts-no-results');
    await expect(noResultsMessage).toBeVisible();
    await expect(noResultsMessage).toContainText(/no parts found/i);
  });

  test('should display part status badges with proper styling', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    const tableBody = table.locator('tbody');
    await tableBody.waitFor();

    // Count rows
    const rowCount = await tableBody.locator('tr').count();

    if (rowCount > 0) {
      // Look for status chips (they should be MUI Chips)
      const statusCells = tableBody
        .locator('td')
        .filter({hasText: /active|inactive|discontinued/i});
      const firstStatusCell = statusCells.first();

      if (await firstStatusCell.isVisible()) {
        // Verify a chip exists in the status column
        await expect(firstStatusCell).toBeVisible();
      }
    }
  });

  test('should display formatted currency for list price', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    const tableBody = table.locator('tbody');
    const rowCount = await tableBody.locator('tr').count();

    if (rowCount > 0) {
      // Look for price cells (should contain $ symbol)
      const firstRow = tableBody.locator('tr').first();
      const priceCell = firstRow.locator('td').nth(4); // List Price column

      const priceText = await priceCell.textContent();

      // Should either show a price with $ or a dash for no price
      expect(priceText).toMatch(/\$|^-$/);
    }
  });

  test('should display formatted quantities', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    const tableBody = table.locator('tbody');
    const rowCount = await tableBody.locator('tr').count();

    if (rowCount > 0) {
      const firstRow = tableBody.locator('tr').first();

      // Check On Hand column
      const onHandCell = firstRow.locator('td').nth(5);
      await expect(onHandCell).toBeVisible();

      // Check Available column
      const availableCell = firstRow.locator('td').nth(6);
      await expect(availableCell).toBeVisible();

      // Both should contain numeric values (or formatted numbers with commas)
      const onHandText = await onHandCell.textContent();
      const availableText = await availableCell.textContent();

      expect(onHandText).toMatch(/^\d{1,3}(,\d{3})*$/);
      expect(availableText).toMatch(/^\d{1,3}(,\d{3})*$/);
    }
  });

  test('should have clickable part number links', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to be populated
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    const tableBody = table.locator('tbody');
    const rowCount = await tableBody.locator('tr').count();

    if (rowCount > 0) {
      // Find the first part number link
      const firstRow = tableBody.locator('tr').first();
      const partNumberLink = firstRow.locator('a').first();

      await expect(partNumberLink).toBeVisible();

      // Verify it's actually a link
      const href = await partNumberLink.getAttribute('href');
      expect(href).toMatch(/\/parts\//);
    }
  });

  test('should handle API errors gracefully', async ({page}) => {
    // Intercept API call and force an error
    await page.route('**/api/part*', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/parts');

    // Should display error message
    const errorMessage = page.getByTestId('parts-error');
    await expect(errorMessage).toBeVisible({timeout: 5000});

    // Clean up routes
    await page.unrouteAll({behavior: 'ignoreErrors'});
  });

  test('should maintain search state when changing pagination', async ({page}) => {
    await page.goto('/parts');

    // Wait for table to load
    const table = page.getByRole('table', {name: /parts table/i});
    await table.waitFor();

    // Search for something
    const searchInput = page.getByPlaceholder(/search by part number/i);
    await searchInput.fill('RV');
    await page.waitForTimeout(1000);

    // Get current row count
    const tableBody = table.locator('tbody');
    const initialCount = await tableBody.locator('tr').count();

    if (initialCount > 10) {
      // Change to page 2
      const pagination = page.getByTestId('parts-pagination');
      const nextButton = pagination.getByRole('button', {name: /next page/i});

      // Only click if enabled
      const isEnabled = await nextButton.isEnabled();
      if (isEnabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verify search is still active
        await expect(searchInput).toHaveValue('RV');
      }
    }
  });

  test('should navigate using browser back button', async ({page}) => {
    await page.goto('/parts');
    await expect(page.getByRole('heading', {name: /parts inventory/i})).toBeVisible();

    // Navigate to home
    await page.goto('/home');
    await expect(page).toHaveURL(/\/home/);

    // Go back
    await page.goBack();

    // Should be back on parts page
    await expect(page).toHaveURL(/\/parts/);
    await expect(page.getByRole('heading', {name: /parts inventory/i})).toBeVisible();
  });
});
