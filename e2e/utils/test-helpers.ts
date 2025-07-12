import { Page, expect } from '@playwright/test';
import path from 'path';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to be fully loaded and interactive
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a test user account
   */
  async createTestUser(email: string = 'test@example.com', password: string = 'testpass123') {
    await this.page.goto('/auth/register');
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    // Click register button
    await this.page.click('button[type="submit"]');
    
    // Wait for successful registration (should redirect to login or dashboard)
    await this.page.waitForURL(/\/(login|dashboard|\/)/, { timeout: 10000 });
  }

  /**
   * Login with test credentials
   */
  async login(email: string = 'test@example.com', password: string = 'testpass123') {
    await this.page.goto('/auth/login');
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    // Click login button
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login (should redirect to dashboard)
    await this.page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
  }

  /**
   * Upload a test video file
   */
  async uploadTestVideo(filename: string = 'test-video.mp4') {
    const testVideoPath = path.join(__dirname, '../fixtures', filename);
    
    // Look for file input or upload zone
    const fileInput = this.page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(testVideoPath);
    } else {
      // Look for upload zone
      const uploadZone = this.page.locator('[data-testid="upload-zone"], .upload-zone');
      await expect(uploadZone).toBeVisible();
      
      // Simulate drag and drop
      await uploadZone.setInputFiles(testVideoPath);
    }
    
    // Wait for upload to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for processing to complete
   */
  async waitForProcessingComplete(timeout: number = 30000) {
    // Wait for processing status to show completed
    await this.page.waitForSelector('[data-testid="processing-completed"], .completed', { 
      timeout 
    });
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content from element
   */
  async getTextContent(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return await element.textContent() || '';
  }

  /**
   * Click element with retry logic
   */
  async clickWithRetry(selector: string, maxRetries: number = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector, { timeout: 5000 });
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill input with retry logic
   */
  async fillWithRetry(selector: string, value: string, maxRetries: number = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.fill(selector, value, { timeout: 5000 });
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 10000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' 
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check for console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * Mock API response for testing
   */
  async mockApiResponse(url: string | RegExp, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
}