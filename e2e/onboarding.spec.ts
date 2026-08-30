import { test, expect } from '@playwright/test';

test.describe('first-run onboarding', () => {
  test('shows the welcome overlay for a fresh visitor and can be skipped', async ({ page }) => {
    await page.goto('/');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Welcome to ReactionArena/)).toBeVisible();
    await expect(dialog.getByText('Train solo')).toBeVisible();

    await dialog.getByRole('button', { name: /Skip for now/ }).click();
    await expect(dialog).toBeHidden();

    const seen = await page.evaluate(() => localStorage.getItem('ra-onboarding-seen'));
    expect(seen).toBe('1');
  });

  test('does not reappear after it has been dismissed', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ra-onboarding-seen', '1'));
    await page.goto('/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
