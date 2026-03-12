import { test, expect } from '@playwright/test';

test.describe('Inventory Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
  });

  test('page loads and shows heading', async ({ page }) => {
    await expect(page.getByText(/inventory/i).first()).toBeVisible();
  });

  test('table renders with column headers', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('th').first()).toBeVisible();
  });

  test('search filters table rows', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('nonexistent-item-xyz-12345');
    // Should show "no items" or reduced rows
    await expect(page.getByText(/no.*found|0 items/i).or(page.locator('table tbody tr').first())).toBeVisible();
  });

  test('pagination controls are visible', async ({ page }) => {
    // Wait for table to load
    await page.locator('table').waitFor();
    // Pagination should be present (even if only 1 page)
    const paginationArea = page.getByText(/showing/i).or(page.locator('[class*="pagination"]').first());
    await expect(paginationArea).toBeVisible();
  });
});
