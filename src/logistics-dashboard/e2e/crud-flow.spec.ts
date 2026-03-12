import { test, expect } from '@playwright/test';

const uniqueName = `E2E-Test-Category-${Date.now()}`;

test.describe('Category CRUD Flow', () => {
  test('create, verify, edit, and delete a category', async ({ page }) => {
    await page.goto('/categories');

    // --- Create ---
    await page.getByRole('button', { name: /add category/i }).click();

    // Fill in name
    const nameInput = page.getByPlaceholder(/category name/i).or(page.locator('input').first());
    await nameInput.fill(uniqueName);

    // Fill description if present
    const descInput = page.getByPlaceholder(/description/i);
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('E2E test description');
    }

    await page.getByRole('button', { name: /create/i }).click();

    // Verify it appears in the table
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10_000 });

    // --- Edit ---
    const row = page.locator('tr', { hasText: uniqueName });
    await row.locator('button').first().click(); // Edit button (first action)

    const editNameInput = page.getByPlaceholder(/category name/i).or(page.locator('input').first());
    await editNameInput.fill(`${uniqueName}-edited`);
    await page.getByRole('button', { name: /update/i }).click();

    await expect(page.getByText(`${uniqueName}-edited`)).toBeVisible({ timeout: 10_000 });

    // --- Delete ---
    const editedRow = page.locator('tr', { hasText: `${uniqueName}-edited` });
    await editedRow.locator('button').nth(1).click(); // Delete button (second action)

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click();

    // Verify removed
    await expect(page.getByText(`${uniqueName}-edited`)).not.toBeVisible({ timeout: 10_000 });
  });
});
