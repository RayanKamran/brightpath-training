import {expect, test} from '@playwright/test';
import {authenticateUser} from './helpers/auth.helper';

test.describe('User Profile Avatar (Authenticated)', () => {
  test.beforeEach(async ({page}) => {
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');
  });

  test('should display user initials in avatar', async ({page}) => {
    await page.goto('/');

    // Wait for the app to load and auth to complete
    await page.waitForTimeout(2000);

    // Look for the profile menu button in the app bar
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});

    // The button should contain an Avatar (not the AccountCircleIcon)
    // Check for the avatar by looking for the MuiAvatar-root class or by checking content
    const avatar = profileButton.locator('[class*="MuiAvatar"]');
    await expect(avatar).toBeVisible();

    // Get the text content of the avatar (should be initials)
    const initialsText = await avatar.textContent();
    expect(initialsText).toBeTruthy();
    expect(initialsText?.length).toBeGreaterThanOrEqual(1);
    expect(initialsText?.length).toBeLessThanOrEqual(2);

    // Initials should be uppercase letters
    expect(initialsText).toMatch(/^[A-Z]{1,2}$/);
  });

  test('should show user full name in tooltip on avatar hover', async ({page}) => {
    await page.goto('/');

    // Wait for the app to load and auth to complete
    await page.waitForTimeout(2000);

    // Look for the profile menu button
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});

    // Hover over the profile button to trigger tooltip
    await profileButton.hover();

    // Wait for tooltip to appear
    await page.waitForTimeout(500);

    // Look for the tooltip - MUI tooltips have role="tooltip"
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible({timeout: 3000});

    // The tooltip should contain text (the user's full name)
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBeTruthy();
    expect(tooltipText?.length).toBeGreaterThan(0);

    // For alice@acme-rv.com, we expect a name (exact name depends on Logto data)
    // Just verify it's not empty and contains text
    expect(tooltipText?.trim()).not.toBe('');
  });

  test('should match avatar initials to tooltip full name', async ({page}) => {
    await page.goto('/');

    // Wait for the app to load and auth to complete
    await page.waitForTimeout(2000);

    // Get the profile button and avatar
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});

    const avatar = profileButton.locator('[class*="MuiAvatar"]');
    const initialsText = await avatar.textContent();

    // Hover to get the tooltip
    await profileButton.hover();
    await page.waitForTimeout(500);

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible({timeout: 3000});
    const fullName = await tooltip.textContent();

    // Verify the relationship between initials and full name
    if (fullName && initialsText) {
      const nameParts = fullName.trim().split(/\s+/);

      if (nameParts.length === 1) {
        // Single name: initial should be first character
        expect(initialsText).toBe(nameParts[0].charAt(0).toUpperCase());
      } else if (nameParts.length >= 2) {
        // Multiple names: should be first + last initial
        const expectedInitials =
          nameParts[0].charAt(0).toUpperCase() +
          nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        expect(initialsText).toBe(expectedInitials);
      }
    }
  });

  test('should open profile menu when avatar is clicked', async ({page}) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Click the profile button
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});
    await profileButton.click();

    // Profile menu should open
    await page.waitForTimeout(500);

    // Look for menu items - Settings and Sign Out
    const menuItems = page.getByRole('menu').getByRole('menuitem');
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Verify expected menu items exist
    await expect(page.getByRole('menuitem', {name: /settings/i})).toBeVisible();
    await expect(page.getByRole('menuitem', {name: /sign out/i})).toBeVisible();
  });

  test('should display avatar consistently across different pages', async ({page}) => {
    // Start on home page
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Get initials from home page
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});
    const avatar = profileButton.locator('[class*="MuiAvatar"]');
    const homePageInitials = await avatar.textContent();

    // Navigate to customers page
    await page.goto('/customers');
    await page.waitForTimeout(1000);

    // Verify avatar still shows same initials
    const customersAvatar = profileButton.locator('[class*="MuiAvatar"]');
    await expect(customersAvatar).toBeVisible();
    const customersPageInitials = await customersAvatar.textContent();
    expect(customersPageInitials).toBe(homePageInitials);

    // Navigate to locations page
    await page.goto('/locations');
    await page.waitForTimeout(1000);

    // Verify avatar still shows same initials
    const locationsAvatar = profileButton.locator('[class*="MuiAvatar"]');
    await expect(locationsAvatar).toBeVisible();
    const locationsPageInitials = await locationsAvatar.textContent();
    expect(locationsPageInitials).toBe(homePageInitials);
  });

  test('should maintain avatar visibility after navigation', async ({page}) => {
    await page.goto('/customers');
    await page.waitForTimeout(2000);

    // Verify avatar is visible
    const profileButton = page.getByRole('button', {name: /profile menu/i});
    await expect(profileButton).toBeVisible({timeout: 5000});
    const avatar = profileButton.locator('[class*="MuiAvatar"]');
    await expect(avatar).toBeVisible();

    // Open and close profile menu
    await profileButton.click();
    await page.waitForTimeout(300);

    // Click outside to close menu
    await page.click('body', {position: {x: 0, y: 0}});
    await page.waitForTimeout(300);

    // Avatar should still be visible
    await expect(avatar).toBeVisible();
  });
});
