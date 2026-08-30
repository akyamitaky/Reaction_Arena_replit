import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ra-onboarding-seen', '1'));
});

test.describe('daily challenge', () => {
  test('shows the daily card, streak calendar, and start button', async ({ page }) => {
    await page.goto('/daily');
    await expect(page.getByRole('heading', { name: /One game/ })).toBeVisible();
    await expect(page.getByText('Streak calendar')).toBeVisible();
    await expect(page.getByText('Streak rewards')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start today's challenge/ })).toBeVisible();
  });

  test('shows a play-again state after completing today', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.addInitScript((key: string) => {
      localStorage.setItem('ra-daily-current', '1');
      localStorage.setItem('ra-daily-best-streak', '1');
      localStorage.setItem('ra-daily-last-date', key);
      localStorage.setItem('ra-daily-last-score', '120');
      localStorage.setItem('ra-daily-best-score', '120');
      localStorage.setItem('ra-daily-history', JSON.stringify([key]));
    }, today);

    await page.goto('/daily');
    await expect(page.getByText(/Completed today/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Play again/ })).toBeVisible();
  });
});
