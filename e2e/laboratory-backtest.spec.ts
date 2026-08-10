import { expect, test } from '@playwright/test';

test('construire une stratégie -> lancer le backtest -> voir les résultats', async ({ page }) => {
  await page.goto('/laboratory');

  await page.getByTestId('rule-toggle-above-31').check();
  await page.getByTestId('window-toggle-1').check();

  await page.getByTestId('run-experiment-button').click();

  await expect(page.getByTestId('experiment-results')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('baseline-comparison').locator('tbody tr')).toHaveCount(5);
  await expect(page.getByTestId('monte-carlo')).toBeVisible();
  await expect(page.getByTestId('generated-grid-row').first()).toBeVisible();
  await expect(page.getByTestId('experiment-row')).toHaveCount(1);
  await expect(page.getByTestId('non-predictive-disclaimer')).toBeVisible();
});
