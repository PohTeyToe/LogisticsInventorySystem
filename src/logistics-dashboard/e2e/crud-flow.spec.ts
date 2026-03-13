import { test, expect } from '@playwright/test';

const uniqueName = `E2E-Test-Category-${Date.now()}`;

test.describe('Category CRUD Flow', () => {
  test('create, verify, edit, and delete a category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // --- Create ---
    await page.getByRole('button', { name: /add category/i }).click();

    // Wait for modal to appear
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();

    // Fill in name (placeholder is "Category name")
    const nameInput = page.getByPlaceholder('Category name');
    await nameInput.fill(uniqueName);

    // Fill description if present
    const descInput = page.getByPlaceholder('Optional description');
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('E2E test description');
    }

    await page.getByRole('button', { name: /^Create$/i }).click();

    // Verify it appears in the table
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10_000 });

    // --- Edit ---
    const row = page.locator('tr', { hasText: uniqueName });
    // Edit button is first button inside the actions div
    await row.locator('button', { has: page.locator('svg') }).first().click();

    // Wait for edit modal to appear
    await expect(dialog).toBeVisible();

    const editNameInput = page.getByPlaceholder('Category name');
    await editNameInput.fill(`${uniqueName}-edited`);
    await page.getByRole('button', { name: /^Update$/i }).click();

    await expect(page.getByText(`${uniqueName}-edited`)).toBeVisible({ timeout: 10_000 });

    // --- Delete ---
    const editedRow = page.locator('tr', { hasText: `${uniqueName}-edited` });
    // Delete button is second button inside the actions div
    await editedRow.locator('button', { has: page.locator('svg') }).nth(1).click();

    // Confirm deletion in the ConfirmDialog
    const confirmBtn = page.locator('button', { hasText: 'Delete' }).last();
    await confirmBtn.click();

    // Verify removed
    await expect(page.getByText(`${uniqueName}-edited`)).not.toBeVisible({ timeout: 10_000 });
  });
});
