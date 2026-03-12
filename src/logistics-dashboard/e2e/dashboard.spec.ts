import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with heading', async ({ page }) => {
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('KPI cards render', async ({ page }) => {
    // Dashboard should show metric cards
    const cards = page.locator('[class*="kpi"], [class*="Kpi"], [class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('charts section renders', async ({ page }) => {
    // Recharts renders SVG elements
    const charts = page.locator('.recharts-wrapper, svg.recharts-surface');
    // Wait a bit for data to load and charts to render
    await expect(charts.first()).toBeVisible({ timeout: 15_000 });
  });
});
