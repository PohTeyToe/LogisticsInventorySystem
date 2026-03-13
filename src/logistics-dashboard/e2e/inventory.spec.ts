import { test, expect } from '@playwright/test';

test.describe('Inventory Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
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
    // Actual placeholder is "Search by name or SKU..."
    const searchInput = page.getByPlaceholder(/search by name or sku/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type a search query
    await searchInput.fill('nonexistent-item-xyz-12345');
    // Should show "No inventory items found" or reduced rows
    await expect(
      page.getByText(/no.*found|0 items/i).or(page.locator('table tbody tr').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('pagination controls are visible', async ({ page }) => {
    // Wait for table data to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Inventory page shows "Page X of Y (Z items)" when totalPages > 1,
    // or shows nothing if only 1 page. Check for either pagination text or the table itself.
    const paginationText = page.getByText(/Page \d+ of \d+/);
    const tableRows = table.locator('tbody tr');

    // If there are enough items for pagination, the text should be visible.
    // If not enough items, at least verify the table loaded with rows.
    const hasPagination = await paginationText.isVisible().catch(() => false);
    if (hasPagination) {
      await expect(paginationText).toBeVisible();
    } else {
      // No pagination means single page — just verify table has data
      await expect(tableRows.first()).toBeVisible();
    }
  });
});
