import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - Frontend Lite', () => {
  const LITE_URL = 'http://localhost:4173';

  test.beforeEach(async ({ page }) => {
    await page.goto(LITE_URL);
  });

  test('should not have any automatically detectable accessibility issues on upload page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
