import { expect, test } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and shows navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: /NationTrack/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });
});
