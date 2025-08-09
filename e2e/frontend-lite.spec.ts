import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Frontend Lite - Frame Picker', () => {
  const LITE_URL = 'http://localhost:4173';
  const TEST_VIDEO = path.join(__dirname, 'fixtures', 'test-video.mp4');

  test.beforeEach(async ({ page }) => {
    await page.goto(LITE_URL);
  });

  test('should load the application with correct title and steps', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle('Frame Picker - AI Video Frame Extraction Tool');
    
    // Check header
    await expect(page.locator('.header__title')).toContainText('🎯 Frame Picker');
    await expect(page.locator('.header__subtitle')).toContainText('AI-powered video frame extraction');
    
    // Check all steps are visible
    const steps = page.locator('.step');
    await expect(steps).toHaveCount(4);
    
    const stepLabels = ['Step 1: Upload', 'Step 2: Configure', 'Step 3: Process', 'Step 4: Results'];
    for (let i = 0; i < stepLabels.length; i++) {
      await expect(steps.nth(i).locator('.step__label')).toContainText(stepLabels[i]);
    }
    
    // Upload step should be active initially
    await expect(steps.nth(0)).toHaveClass(/step--active/);
    await expect(page.locator('#upload-step')).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Create a fake text file
    const fileContent = 'This is not a video file';
    const fileName = 'fake-video.txt';
    
    await page.setInputFiles('#file-input', {
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });

    // Should show error
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('Please select a video file');
  });

  test('should show error for oversized file', async ({ page }) => {
    // Create a fake large video file (simulate > 100MB)
    const largeFileSize = 101 * 1024 * 1024; // 101MB
    const fileName = 'large-video.mp4';
    
    // Note: We can't actually create a 101MB buffer in tests, so we'll mock this
    await page.evaluate(() => {
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const mockFile = new File([''], 'large-video.mp4', { 
        type: 'video/mp4',
        lastModified: Date.now()
      });
      
      // Mock the size property
      Object.defineProperty(mockFile, 'size', {
        value: 101 * 1024 * 1024,
        writable: false
      });

      // Trigger file handling directly
      (window as any).app.handleFile(mockFile);
    });

    // Should show error
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('File must be under 100MB');
  });

  test('should complete full video processing flow', async ({ page }) => {
    // Skip if test video doesn't exist
    try {
      await page.setInputFiles('#file-input', TEST_VIDEO);
    } catch (error) {
      test.skip('Test video file not found, skipping integration test');
    }

    // Step 1: Upload should start
    await expect(page.locator('#upload-progress')).toBeVisible();
    await expect(page.locator('.upload__icon--loading')).toBeVisible();

    // Wait for upload to complete and move to configure step
    await expect(page.locator('#configure-step')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.step').nth(1)).toHaveClass(/step--active/);

    // Check file info is displayed
    await expect(page.locator('#file-info')).toBeVisible();
    await expect(page.locator('#file-name')).toContainText('test-video.mp4');
    await expect(page.locator('#file-size')).toContainText('MB');

    // Step 2: Configure processing options
    await page.selectOption('#mode', 'profile');
    await page.selectOption('#quality', 'fast'); // Use fast for quicker test
    await page.selectOption('#count', '1'); // Just 1 frame for test
    await page.selectOption('#sample-rate', '30');

    // Start processing
    await page.click('#process-btn');

    // Step 3: Processing should start OR results might appear immediately for fast processing
    // We'll check for either processing or results step
    const processingStep = page.locator('#processing-step');
    const resultsStep = page.locator('#results-step');
    
    try {
      // Try to catch processing step (might be very fast)
      await expect(processingStep).toBeVisible({ timeout: 2000 });
      await expect(page.locator('.step').nth(2)).toHaveClass(/step--active/);
      
      // Wait for processing to complete
      await expect(resultsStep).toBeVisible({ timeout: 60000 });
    } catch (e) {
      // If processing was too fast to catch, check if we're already at results
      await expect(resultsStep).toBeVisible({ timeout: 5000 });
    }
    
    await expect(page.locator('.step').nth(3)).toHaveClass(/step--active/);

    // Step 4: Results should be displayed
    const resultItems = page.locator('.result-item');
    await expect(resultItems).toHaveCount(1); // We requested 1 frame

    // Check that images are loaded
    const resultImage = resultItems.first().locator('.result-item__image');
    await expect(resultImage).toBeVisible();
    await expect(resultImage).toHaveAttribute('src', /download/);

    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await resultItems.first().hover();
    await resultItems.first().locator('.btn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/frame_\d+\.jpg/);

    // Test download all functionality
    await expect(page.locator('#download-all-container')).toBeVisible();
    
    // Test reset functionality
    await page.click('button:has-text("🔄 Start Over")');
    await expect(page.locator('#upload-step')).toBeVisible();
    await expect(page.locator('.step').nth(0)).toHaveClass(/step--active/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/sessions', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });

    // Try to upload a file
    await page.setInputFiles('#file-input', {
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content'),
    });

    // Should show error
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('Failed to create session');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone viewport

    // Header should be visible and properly formatted
    await expect(page.locator('.header__title')).toBeVisible();
    
    // Steps should stack vertically on mobile
    const steps = page.locator('.steps');
    await expect(steps).toHaveCSS('flex-direction', 'column');
    
    // Upload zone should be visible and usable
    const uploadZone = page.locator('#upload-zone');
    await expect(uploadZone).toBeVisible();
    
    // Grid should be single column on mobile
    await page.goto(LITE_URL + '?mock=configure'); // Mock being on configure step
    const grid = page.locator('.grid--2-col');
    
    // Check that grid items stack vertically (single column)
    const gridComputedStyle = await page.evaluate(() => {
      const grid = document.querySelector('.grid--2-col');
      return grid ? getComputedStyle(grid).gridTemplateColumns : '';
    });
    
    // On mobile, should be '1fr' (single column)
    expect(gridComputedStyle).toBe('1fr');
  });

  test('should handle drag and drop file upload', async ({ page }) => {
    const uploadZone = page.locator('#upload-zone');
    
    // Simulate drag over
    await page.evaluate(() => {
      const zone = document.getElementById('upload-zone');
      const event = new DragEvent('dragover', { 
        bubbles: true, 
        cancelable: true 
      });
      zone?.dispatchEvent(event);
    });
    
    // Should add dragover class
    await expect(uploadZone).toHaveClass(/upload-zone--dragover/);
    
    // Simulate drag leave
    await page.evaluate(() => {
      const zone = document.getElementById('upload-zone');
      const event = new DragEvent('dragleave', { 
        bubbles: true, 
        cancelable: true 
      });
      zone?.dispatchEvent(event);
    });
    
    // Should remove dragover class
    await expect(uploadZone).not.toHaveClass(/upload-zone--dragover/);
  });

  test('should show no results message when processing finds no frames', async ({ page }) => {
    // Mock the API to return empty results
    await page.route('**/api/sessions/*/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Mock other API calls to simulate successful processing
    await page.route('**/api/sessions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'test-session-123' })
      });
    });

    await page.route('**/api/sessions/*/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Upload successful' })
      });
    });

    await page.route('**/api/sessions/*/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Processing started' })
      });
    });

    await page.route('**/api/sessions/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          status: 'completed',
          progress: 100,
          message: 'Processing complete'
        })
      });
    });

    // Upload a test file
    await page.setInputFiles('#file-input', {
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content'),
    });

    // Wait for configure step and start processing
    await expect(page.locator('#configure-step')).toBeVisible({ timeout: 5000 });
    await page.click('#process-btn');

    // Wait for results step
    await expect(page.locator('#results-step')).toBeVisible({ timeout: 10000 });

    // Should show no results message
    await expect(page.locator('#no-results')).toBeVisible();
    await expect(page.locator('#no-results')).toContainText('No suitable frames found');
    
    // Download all button should be hidden
    await expect(page.locator('#download-all-container')).not.toBeVisible();
  });

  test('should preserve form state during processing', async ({ page }) => {
    // Set some form values
    await page.evaluate(() => {
      // Simulate being on configure step
      (window as any).app.step = 'configure';
      (window as any).app.file = new File([''], 'test.mp4', { type: 'video/mp4' });
      (window as any).app.updateUI();
    });

    await expect(page.locator('#configure-step')).toBeVisible();

    await page.selectOption('#mode', 'action');
    await page.selectOption('#quality', 'best');
    await page.selectOption('#count', '5');
    await page.selectOption('#sample-rate', '15');

    // Check form values are set correctly
    await expect(page.locator('#mode')).toHaveValue('action');
    await expect(page.locator('#quality')).toHaveValue('best');
    await expect(page.locator('#count')).toHaveValue('5');
    await expect(page.locator('#sample-rate')).toHaveValue('15');
    
    // Form values should remain when going back to configure step
    await page.evaluate(() => {
      (window as any).app.step = 'processing';
      (window as any).app.updateUI();
    });
    
    await page.evaluate(() => {
      (window as any).app.step = 'configure';
      (window as any).app.updateUI();
    });

    // Values should still be there
    await expect(page.locator('#mode')).toHaveValue('action');
    await expect(page.locator('#quality')).toHaveValue('best');
    await expect(page.locator('#count')).toHaveValue('5');
    await expect(page.locator('#sample-rate')).toHaveValue('15');
  });
});
