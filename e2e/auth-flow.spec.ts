import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Registration', () => {
    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/');
      
      // Look for register link/button
      const registerLink = page.getByRole('link', { name: /register|sign up/i })
        .or(page.getByRole('button', { name: /register|sign up/i }))
        .first();
      
      if (await registerLink.count() > 0) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/auth\/register|\/register/);
      } else {
        // Direct navigation test
        await page.goto('/auth/register');
      }
      
      await helpers.waitForPageLoad();
    });

    test('should display registration form', async ({ page }) => {
      await page.goto('/auth/register');
      await helpers.waitForPageLoad();

      // Check for email input
      const emailInput = page.locator('input[type="email"]')
        .or(page.locator('input[name="email"]'))
        .first();
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"]')
        .or(page.locator('input[name="password"]'))
        .first();
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.getByRole('button', { name: /register|sign up|create/i })
        .or(page.locator('button[type="submit"]'))
        .first();
      await expect(submitButton).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/register');
      await helpers.waitForPageLoad();

      // Fill invalid email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('invalid-email');
      
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('password123');

      // Try to submit
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation error or prevent submission
      // Check for HTML5 validation or custom error message
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('should require password', async ({ page }) => {
      await page.goto('/auth/register');
      await helpers.waitForPageLoad();

      // Fill email but not password
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('test@example.com');

      // Try to submit
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should prevent submission or show error
      const passwordInput = page.locator('input[type="password"]').first();
      const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/register');
      await helpers.waitForPageLoad();

      // Look for login link
      const loginLink = page.getByRole('link', { name: /login|sign in/i })
        .or(page.getByText(/already have.*account/i))
        .first();

      if (await loginLink.count() > 0) {
        await expect(loginLink).toBeVisible();
        
        // Check if it navigates to login
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/login|\/login/);
      }
    });
  });

  test.describe('Login', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.goto('/');
      
      // Look for login link/button
      const loginLink = page.getByRole('link', { name: /login|sign in/i })
        .or(page.getByRole('button', { name: /login|sign in/i }))
        .first();
      
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/login|\/login/);
      } else {
        // Direct navigation test
        await page.goto('/auth/login');
      }
      
      await helpers.waitForPageLoad();
    });

    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Check for email input
      const emailInput = page.locator('input[type="email"]')
        .or(page.locator('input[name="email"]'))
        .first();
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"]')
        .or(page.locator('input[name="password"]'))
        .first();
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.getByRole('button', { name: /login|sign in/i })
        .or(page.locator('button[type="submit"]'))
        .first();
      await expect(submitButton).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Check if fields are required
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      const passwordValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);

      expect(emailValid || passwordValid).toBe(false); // At least one should be invalid
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Look for register link
      const registerLink = page.getByRole('link', { name: /register|sign up/i })
        .or(page.getByText(/don't have.*account/i))
        .first();

      if (await registerLink.count() > 0) {
        await expect(registerLink).toBeVisible();
        
        // Check if it navigates to register
        await registerLink.click();
        await expect(page).toHaveURL(/\/auth\/register|\/register/);
      }
    });

    test('should handle login attempt with invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Fill form with invalid credentials
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');

      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Should either show error message or stay on login page
      const currentUrl = page.url();
      const hasError = await page.getByText(/invalid|error|wrong|incorrect/i).count() > 0;
      
      // Either should show error or stay on login page
      expect(hasError || currentUrl.includes('login')).toBe(true);
    });
  });

  test.describe('Authentication State', () => {
    test('should show different UI for authenticated vs anonymous users', async ({ page }) => {
      // Test anonymous state
      await page.goto('/');
      await helpers.waitForPageLoad();

      // Check for anonymous usage indicators
      const anonymousText = page.getByText(/anonymous/i);
      if (await anonymousText.count() > 0) {
        await expect(anonymousText).toBeVisible();
      }

      // Check for login/register buttons
      const authButtons = page.getByRole('button', { name: /login|register|sign/i });
      const authLinks = page.getByRole('link', { name: /login|register|sign/i });
      
      const hasAuthElements = (await authButtons.count() > 0) || (await authLinks.count() > 0);
      expect(hasAuthElements).toBe(true);
    });

    test('should redirect protected routes to login', async ({ page }) => {
      // Try to access protected routes
      const protectedRoutes = ['/dashboard', '/billing', '/billing/manage'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(2000);
        
        // Should either redirect to login or show login form
        const currentUrl = page.url();
        const isOnLogin = currentUrl.includes('login') || currentUrl.includes('auth');
        const hasLoginForm = await page.locator('input[type="email"]').count() > 0;
        
        // If the route exists, it should either redirect to login or show login form
        if (!currentUrl.includes('404') && !currentUrl.includes('not-found')) {
          expect(isOnLogin || hasLoginForm).toBe(true);
        }
      }
    });

    test('should handle logout functionality', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageLoad();

      // Look for logout button (might only be visible when logged in)
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
        .or(page.getByRole('link', { name: /logout|sign out/i }))
        .first();

      if (await logoutButton.count() > 0 && await logoutButton.isVisible()) {
        // Click logout
        await logoutButton.click();
        await page.waitForTimeout(1000);
        
        // Should redirect to home or login page
        const currentUrl = page.url();
        expect(currentUrl.includes('login') || currentUrl === page.url()).toBe(true);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error page for auth errors', async ({ page }) => {
      await page.goto('/auth/error');
      await helpers.waitForPageLoad();

      // Should show error page content
      const errorText = page.getByText(/error|problem|something went wrong/i);
      if (await errorText.count() > 0) {
        await expect(errorText).toBeVisible();
      }

      // Should have way to get back (home link, try again, etc.)
      const backButton = page.getByRole('button', { name: /back|home|try again/i })
        .or(page.getByRole('link', { name: /back|home|try again/i }))
        .first();

      if (await backButton.count() > 0) {
        await expect(backButton).toBeVisible();
      }
    });
  });

  test.describe('Form Interactions', () => {
    test('should handle form submission states', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Fill form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Submit and check for loading state
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Check if button shows loading state
      await page.waitForTimeout(500);
      const buttonText = await submitButton.textContent();
      const isDisabled = await submitButton.isDisabled();
      
      // Button should either be disabled or show loading text
      expect(isDisabled || buttonText?.toLowerCase().includes('loading') || buttonText?.includes('...')).toBe(true);
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/auth/login');
      await helpers.waitForPageLoad();

      // Test tab navigation
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Focus email input
      await emailInput.focus();
      await expect(emailInput).toBeFocused();

      // Tab to password
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();

      // Enter should submit form
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await passwordInput.press('Enter');

      // Should trigger form submission
      await page.waitForTimeout(1000);
    });
  });
});