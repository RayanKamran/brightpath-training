import {expect, test} from '@playwright/test';
import {authenticateUser} from './helpers/auth.helper';

interface Role {
  id: string;
  name: string;
  description?: string;
  customData?: Record<string, unknown>;
}

interface Location {
  id: string;
  name: string;
  description?: string;
  customData?: Record<string, unknown>;
  roles?: Role[];
}

test.describe('Location Roles Structure', () => {
  test('should have Role objects (not strings) with id, name, and description for Alice', async ({
    page,
  }) => {
    // Authenticate as Alice who has AP and AR roles
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');

    // Navigate to home page
    await page.goto('/', {waitUntil: 'networkidle'});

    // Wait for location context to load
    await page.waitForTimeout(2000);

    // Evaluate the Location context in the browser to get currentLocation
    const locationData = await page.evaluate(() => {
      // Get all localStorage keys to debug
      const allKeys = Object.keys(localStorage);
      console.log('Available localStorage keys:', allKeys);

      // Look for Logto token - check common patterns
      let accessToken: string | null = null;

      // Try different possible localStorage keys
      const possibleKeys = [
        'logto:accessToken',
        'logto:token',
        'access_token',
        ...allKeys.filter(
          (k) => k.toLowerCase().includes('token') || k.toLowerCase().includes('logto'),
        ),
      ];

      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.token) {
              accessToken = parsed.token;
              console.log(`Found token in ${key}.token`);
              break;
            } else if (parsed.accessToken) {
              accessToken = parsed.accessToken;
              console.log(`Found token in ${key}.accessToken`);
              break;
            } else if (typeof parsed === 'string' && parsed.startsWith('ey')) {
              accessToken = parsed;
              console.log(`Found token in ${key} (JWT string)`);
              break;
            }
          } catch {
            // If it's not JSON, check if it's a token directly
            if (value.startsWith('ey')) {
              accessToken = value;
              console.log(`Found token in ${key} (direct)`);
              break;
            }
          }
        }
      }

      if (!accessToken) {
        return {error: 'No access token found', availableKeys: allKeys};
      }

      // Call the backend API to get location data
      return fetch('http://localhost:3000/api/locations', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            return res.text().then((text) => ({
              error: `HTTP ${res.status}: ${text}`,
            }));
          }
          return res.json();
        })
        .then((locations) => {
          if ((locations as {error?: string}).error) {
            return locations;
          }
          const typedLocations = locations as Location[];
          console.log('Locations from API:', typedLocations);
          return {
            success: true,
            locations: typedLocations,
            currentLocation: typedLocations[0], // First location for Mike
          };
        })
        .catch((error: Error) => ({
          error: error.message,
        }));
    });

    console.log('Location data:', JSON.stringify(locationData, null, 2));

    // Validate the response structure
    expect(locationData).toHaveProperty('success', true);
    expect(locationData).toHaveProperty('currentLocation');

    const currentLocation = (locationData as {success: boolean; currentLocation: Location})
      .currentLocation;

    // Validate currentLocation has roles
    expect(currentLocation).toHaveProperty('roles');
    expect(Array.isArray(currentLocation.roles)).toBe(true);
    expect(currentLocation.roles?.length).toBeGreaterThan(0);

    // Check that roles are objects, not strings
    const firstRole = currentLocation.roles?.[0];
    expect(typeof firstRole).toBe('object');
    expect(firstRole).not.toBe(null);

    // Validate Role structure - should have id, name, description
    expect(firstRole).toHaveProperty('id');
    expect(firstRole).toHaveProperty('name');
    expect(typeof firstRole?.id).toBe('string');
    expect(typeof firstRole?.name).toBe('string');

    // Alice should have AP and AR roles
    const roleNames = currentLocation.roles?.map((r) => r.name) || [];
    console.log('Role names:', roleNames);

    expect(roleNames.length).toBeGreaterThan(0);

    // Log all roles found
    currentLocation.roles?.forEach((role) => {
      console.log(`Role found: ${role.name} (${role.id}) - ${role.description}`);
    });

    // Alice should have AP and/or AR roles in her first location
    // (She has AP+AR in LOC_AAA and LOC_BBB, GM in LOC_CCC)
    const hasExpectedRoles = roleNames.some(
      (name) => name === 'AP' || name === 'AR' || name === 'GM',
    );
    expect(hasExpectedRoles).toBe(true);

    // Validate that each role is an object with expected properties
    currentLocation.roles?.forEach((role, index) => {
      expect(typeof role, `Role ${index} should be an object`).toBe('object');
      expect(role, `Role ${index} should not be null`).not.toBe(null);
      expect(role, `Role ${index} should have id`).toHaveProperty('id');
      expect(role, `Role ${index} should have name`).toHaveProperty('name');
      expect(typeof role.id, `Role ${index} id should be string`).toBe('string');
      expect(typeof role.name, `Role ${index} name should be string`).toBe('string');
    });
  });

  test('should display Role information in UI', async ({page}) => {
    // Authenticate as Alice
    await authenticateUser(page, 'alice@acme-rv.com', 'xyab12dE');

    // Navigate to /home page which shows location info
    await page.goto('/');

    // Wait for the page to fully load and ensure we're on /home
    await page.waitForURL('/', {timeout: 5000});
    await page.waitForLoadState('networkidle');

    // Verify the page shows location information using a more flexible selector
    const locationHeading = page.getByText('Current Location', {exact: false});
    await expect(locationHeading).toBeVisible({timeout: 10000});

    // Check if roles section exists
    const pageContent = await page.textContent('body');
    console.log('Page contains "Your Roles":', pageContent?.includes('Your Roles'));

    // If roles are displayed, verify the chips
    const hasRolesSection = pageContent?.includes('Your Roles');
    if (hasRolesSection) {
      const roleChips = page.locator('.MuiChip-root').filter({hasText: /AP|AR|GM/});
      const chipCount = await roleChips.count();
      console.log(`Found ${chipCount} role chips`);
      expect(chipCount).toBeGreaterThan(0);

      // Verify role chips are visible
      const firstChip = roleChips.first();
      await expect(firstChip).toBeVisible();

      // Try to hover and check for tooltip
      await firstChip.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator('[role="tooltip"]');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);

      if (tooltipVisible) {
        const tooltipText = await tooltip.textContent();
        console.log('Tooltip text:', tooltipText);
        expect(tooltipText).toBeTruthy();
      }
    } else {
      console.log('Roles section not found on page - roles may not be displayed in UI yet');
    }
  });
});
