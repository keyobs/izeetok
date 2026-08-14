import { expect, test } from '@playwright/test';

test('saisie -> évaluation -> géométrie', async ({ page }) => {
  await page.goto('/evaluation');

  const numbers = [3, 7, 19, 31, 42];
  const stars = [2, 9];
  for (const [index, value] of numbers.entries()) {
    await page.getByTestId(`number-input-${index}`).fill(String(value));
  }
  for (const [index, value] of stars.entries()) {
    await page.getByTestId(`star-input-${index}`).fill(String(value));
  }
  await page.getByTestId('evaluate-button').click();

  await expect(page.getByTestId('evaluation-results')).toBeVisible();
  await expect(page.getByTestId('score-card')).toHaveCount(4);
  await expect(page.getByTestId('variations').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('non-predictive-disclaimer')).toBeVisible();

  await page.getByRole('link', { name: 'Géométrie' }).click();

  await expect(page).toHaveURL(/\/geometry$/);
  await expect(page.getByTestId('gap-map')).toBeVisible();
  await expect(page.getByTestId('neighbor-row').first()).toBeVisible();
  await expect(page.getByTestId('non-predictive-disclaimer')).toBeVisible();
});
