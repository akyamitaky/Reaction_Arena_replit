import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ra-onboarding-seen', '1'));
});

test.describe('solo game flow', () => {
  test('starts a game, shows the HUD, and restarts with R', async ({ page }) => {
    await page.goto('/select');
    await page.getByRole('button', { name: /Solve quick arithmetic/ }).click();
    await expect(page).toHaveURL(/\/play\/math$/);

    await expect(page.getByRole('heading', { name: 'Math' })).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByText(/Round 1\/10/)).toBeVisible();
    await expect(page.getByText(/\d+s$/).first()).toBeVisible();

    await page.keyboard.press('r');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('Esc returns to the mode selection', async ({ page }) => {
    await page.goto('/select');
    await page.getByRole('button', { name: /Solve quick arithmetic/ }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/select$/);
  });

  test('number keys jump to a game from the select page', async ({ page }) => {
    await page.goto('/select');
    await expect(page.getByText(/1–9 to jump to a game/)).toBeVisible();
    await page.keyboard.press('1');
    await expect(page).toHaveURL(/\/play\/color$/);
  });
});
