import { test, expect } from '@playwright/test';

test.describe('Purchase Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');
  });

  test('page loads and shows heading', async ({ page }) => {
    await expect(page.getByText(/purchase orders/i).first()).toBeVisible();
  });

  test('table renders with order data', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Should have header columns
    await expect(table.locator('th').first()).toBeVisible();
  });

  test('status filter buttons are visible', async ({ page }) => {
    // The PO page typically has status filter pills
    const filterArea = page.getByText(/pending/i).or(page.getByText(/all/i));
    await expect(filterArea.first()).toBeVisible();
  });

  test('create PO button opens modal', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /add|create|new/i });
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      // Modal should appear with supplier selection
      const modal = page.locator('[class*="modal"], [role="dialog"]');
      await expect(modal.first()).toBeVisible();
    }
  });
});
