import { test, expect } from '@playwright/test';

const sidebarLinks = [
  { label: 'Dashboard', path: '/', heading: /dashboard/i },
  { label: 'Reports', path: '/reports', heading: /reports/i },
  { label: 'Analytics', path: '/analytics', heading: /analytics/i },
  { label: 'Items', path: '/inventory', heading: /inventory/i },
  { label: 'Categories', path: '/categories', heading: /categories/i },
  { label: 'Warehouses', path: '/warehouses', heading: /warehouses/i },
  { label: 'Suppliers', path: '/suppliers', heading: /suppliers/i },
  { label: 'Purchase Orders', path: '/purchase-orders', heading: /purchase orders/i },
  { label: 'Stock Movements', path: '/stock-movements', heading: /stock movements/i },
  { label: 'CSV Import', path: '/import', heading: /import/i },
  { label: 'Settings', path: '/settings', heading: /settings/i },
];

test.describe('Sidebar Navigation', () => {
  test('all sidebar links navigate to correct pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const link of sidebarLinks) {
      const nav = page.locator('aside[aria-label="Main navigation"] nav');
      await nav.getByText(link.label, { exact: true }).click();
      await page.waitForURL(`**${link.path}`, { timeout: 10_000 });
      await page.waitForLoadState('networkidle');
      // Page should have some content — not a blank page
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('unknown routes show not-found page', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Page not found')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar brand is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('LogisticsPulse')).toBeVisible();
  });
});
