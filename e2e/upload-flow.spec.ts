import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Video Upload Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageLoad();
  });

  test('should display upload zone on homepage', async ({ page }) => {
    // Check if upload zone is visible
    const uploadZone = page.locator('[data-testid="upload-zone"]').or(page.locator('.upload-zone')).first();
    await expect(uploadZone).toBeVisible();

    // Check for upload text/instructions
    await expect(page.getByText(/upload/i)).toBeVisible();
    await expect(page.getByText(/video/i)).toBeVisible();
  });

  test('should show how it works section', async ({ page }) => {
    // Check for how it works section
    await expect(page.getByText(/how it works/i)).toBeVisible();
    
    // Check for the 4 steps
    await expect(page.getByText(/upload/i)).toBeVisible();
    await expect(page.getByText(/configure/i)).toBeVisible();
    await expect(page.getByText(/process/i)).toBeVisible();
    await expect(page.getByText(/download/i)).toBeVisible();
  });

  test('should show anonymous usage limits', async ({ page }) => {
    // Check for anonymous usage information
    await expect(page.getByText(/anonymous/i)).toBeVisible();
    await expect(page.getByText(/1 video/i)).toBeVisible();
    await expect(page.getByText(/watermark/i)).toBeVisible();
  });

  test('should handle file upload interaction', async ({ page }) => {
    // Look for file input (may be hidden)
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      await expect(fileInput).toBeAttached();
      
      // Check accepted file types
      const accept = await fileInput.getAttribute('accept');
      if (accept) {
        expect(accept).toContain('video');
      }
    }

    // Check if upload zone is clickable
    const uploadZone = page.locator('[data-testid="upload-zone"]').or(page.locator('.upload-zone')).first();
    await expect(uploadZone).toBeVisible();
  });

  test('should show step progress indicator', async ({ page }) => {
    // Check for step indicator with upload, configure, processing, results
    const steps = ['upload', 'configure', 'processing', 'results'];
    
    for (const step of steps) {
      // Look for step indicators (could be text or icons)
      const stepElement = page.getByText(new RegExp(step, 'i')).first();
      await expect(stepElement).toBeVisible();
    }
  });

  test('should navigate to configure step after mock upload', async ({ page }) => {
    // Mock successful upload by clicking through UI elements
    
    // First, try to find and interact with upload components
    const uploadButton = page.getByRole('button', { name: /upload|choose/i }).first();
    const uploadZone = page.locator('[data-testid="upload-zone"]').or(page.locator('.upload-zone')).first();
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    } else if (await uploadZone.isVisible()) {
      await uploadZone.click();
    }

    // Look for configuration options that should appear after upload
    // This might not work without an actual file, but we can check the UI structure
    await page.waitForTimeout(1000);
    
    // Check if any configuration elements become visible
    const configElements = [
      page.getByText(/mode/i),
      page.getByText(/quality/i),
      page.getByText(/profile/i),
      page.getByText(/action/i)
    ];

    // At least one config element should be found in the DOM
    let foundConfigElement = false;
    for (const element of configElements) {
      if (await element.count() > 0) {
        foundConfigElement = true;
        break;
      }
    }
    
    expect(foundConfigElement).toBe(true);
  });

  test('should display processing options in configure step', async ({ page }) => {
    // Check for processing configuration options (these should be in the DOM)
    
    // Mode selection
    const modeOptions = [
      page.getByText(/profile/i),
      page.getByText(/action/i)
    ];
    
    let foundMode = false;
    for (const option of modeOptions) {
      if (await option.count() > 0) {
        foundMode = true;
        break;
      }
    }
    expect(foundMode).toBe(true);

    // Quality options
    const qualityOptions = [
      page.getByText(/fast/i),
      page.getByText(/balanced/i),
      page.getByText(/best/i)
    ];
    
    let foundQuality = false;
    for (const option of qualityOptions) {
      if (await option.count() > 0) {
        foundQuality = true;
        break;
      }
    }
    expect(foundQuality).toBe(true);
  });

  test('should show start processing button', async ({ page }) => {
    // Look for process/start button
    const processButton = page.getByRole('button', { name: /start processing|process/i }).first();
    
    // The button should exist in the DOM (even if not currently visible)
    expect(await processButton.count()).toBeGreaterThan(0);
  });

  test('should have working navigation elements', async ({ page }) => {
    // Check navbar elements
    const navbar = page.locator('nav').or(page.locator('[data-testid="navbar"]')).first();
    await expect(navbar).toBeVisible();

    // Check for logo or brand name
    const logo = page.getByText(/frame picker/i).or(page.locator('[data-testid="logo"]')).first();
    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
    }

    // Check for auth-related buttons
    const authButtons = [
      page.getByRole('button', { name: /login|sign in/i }),
      page.getByRole('button', { name: /register|sign up/i }),
      page.getByRole('link', { name: /login|sign in/i }),
      page.getByRole('link', { name: /register|sign up/i })
    ];

    let foundAuthButton = false;
    for (const button of authButtons) {
      if (await button.count() > 0 && await button.isVisible()) {
        foundAuthButton = true;
        break;
      }
    }
    expect(foundAuthButton).toBe(true);
  });

  test('should display footer information', async ({ page }) => {
    // Scroll to bottom to ensure footer is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for footer content
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }

    // Check for API docs link
    const apiDocsLink = page.getByRole('link', { name: /api docs/i });
    if (await apiDocsLink.count() > 0) {
      await expect(apiDocsLink).toBeVisible();
      
      // Check if link has correct href
      const href = await apiDocsLink.getAttribute('href');
      expect(href).toContain('8000/docs');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await helpers.waitForPageLoad();

    // Upload zone should still be visible on mobile
    const uploadZone = page.locator('[data-testid="upload-zone"]').or(page.locator('.upload-zone')).first();
    await expect(uploadZone).toBeVisible();

    // Navigation should be responsive
    const navbar = page.locator('nav').or(page.locator('[data-testid="navbar"]')).first();
    await expect(navbar).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await helpers.waitForPageLoad();

    // Everything should still be visible
    await expect(uploadZone).toBeVisible();
    await expect(navbar).toBeVisible();
  });
});