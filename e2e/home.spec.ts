import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ra-onboarding-seen', '1'));
});

test.describe('home page', () => {
  test('renders the hero and core stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Train fast/ })).toBeVisible();
    await expect(page.getByText('Game modes')).toBeVisible();
    await expect(page.getByText('The full library')).toBeVisible();
    await expect(page.getByText(/35 modes to sharpen/)).toBeVisible();
  });

  test('starts a solo session after entering a name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start practicing/ }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Your name').fill('Tester');
    await dialog.getByRole('button', { name: /Start Playing/ }).click();

    await expect(page).toHaveURL(/\/select$/);
    await expect(page.getByText(/Choose your edge, Tester/)).toBeVisible();
  });

  test('hosts an arena after entering a name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Host an arena/ }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Your name').fill('Tester');
    await dialog.getByRole('button', { name: /Let's Go!/ }).click();

    await expect(page).toHaveURL(/\/arena-setup$/);
  });

  test('navigates to the daily challenge from the hero card', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Daily Challenge').first().click();
    await expect(page).toHaveURL(/\/daily$/);
  });

  test('navigates to the personal stats page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /View stats/ }).click();
    await expect(page).toHaveURL(/\/stats$/);
    await expect(page.getByRole('heading', { name: 'Personal stats' })).toBeVisible();
  });

  test('theme and colorblind toggles persist', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /theme/i }).first().click();
    await page.getByRole('button', { name: /colorblind/i }).click();

    const theme = await page.evaluate(() => localStorage.getItem('reaction-theme'));
    const colorblind = await page.evaluate(() => localStorage.getItem('ra-colorblind'));
    expect(['light', 'dark']).toContain(theme);
    expect(colorblind).toBe('1');
    await expect(page.locator('html')).toHaveAttribute('data-colorblind', 'on');
  });
});
