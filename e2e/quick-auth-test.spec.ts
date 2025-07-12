import { test, expect } from '@playwright/test';

test('debug auth links', async ({ page }) => {
  await page.goto('/auth/register');
  await page.waitForLoadState('networkidle');
  
  // Check what login links exist
  console.log('=== LOGIN LINKS DEBUG ===');
  
  const allLinks = await page.locator('a').all();
  for (const link of allLinks) {
    const href = await link.getAttribute('href');
    const text = await link.textContent();
    console.log(`Link: "${text}" -> ${href}`);
  }
  
  // Try to find and click login link
  const loginLink = page.getByText(/sign in here/i).first();
  if (await loginLink.count() > 0) {
    console.log('Found login link, clicking...');
    await loginLink.click();
    await page.waitForTimeout(2000);
    console.log('New URL:', page.url());
  } else {
    console.log('Login link not found');
  }
});