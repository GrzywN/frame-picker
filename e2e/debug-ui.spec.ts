import { test, expect } from '@playwright/test';

test.describe('Debug UI Issues', () => {
  test('should inspect homepage structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'e2e/screenshots/homepage-debug.png', fullPage: true });

    // Log page content
    const bodyText = await page.locator('body').textContent();
    console.log('=== HOMEPAGE BODY TEXT ===');
    console.log(bodyText?.substring(0, 1000));

    // Check for upload elements
    console.log('\n=== UPLOAD ELEMENTS ===');
    const uploadElements = await page.locator('*').evaluateAll(elements => {
      return elements.filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        const id = el.id?.toLowerCase() || '';
        return text.includes('upload') || 
               className.includes('upload') || 
               id.includes('upload') ||
               el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'file';
      }).map(el => ({
        tag: el.tagName,
        className: el.className,
        id: el.id,
        text: el.textContent?.substring(0, 100),
        type: (el as HTMLInputElement).type || 'N/A'
      }));
    });
    console.log('Upload elements found:', uploadElements);

    // Check for navigation elements
    console.log('\n=== NAVIGATION ELEMENTS ===');
    const navElements = await page.locator('nav, [data-testid*="nav"], .nav').allTextContents();
    console.log('Navigation elements:', navElements);

    // Check for buttons
    console.log('\n=== BUTTONS ===');
    const buttons = await page.locator('button').evaluateAll(buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.substring(0, 50),
        className: btn.className,
        disabled: btn.disabled,
        type: (btn as HTMLButtonElement).type,
        visible: btn.offsetParent !== null
      }))
    );
    console.log('Buttons found:', buttons);

    // Check for form elements
    console.log('\n=== FORM INPUTS ===');
    const inputs = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({
        type: (input as HTMLInputElement).type,
        name: (input as HTMLInputElement).name,
        placeholder: (input as HTMLInputElement).placeholder,
        className: input.className,
        visible: input.offsetParent !== null
      }))
    );
    console.log('Form inputs found:', inputs);

    // Check current URL and page title
    console.log('\n=== PAGE INFO ===');
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Check for any error messages in console
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
    console.log('Console messages:', consoleMessages);
  });

  test('should inspect auth pages', async ({ page }) => {
    // Check login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== LOGIN PAGE ===');
    console.log('URL:', page.url());
    
    const loginFormElements = await page.locator('form, input[type="email"], input[type="password"], button[type="submit"]').evaluateAll(elements =>
      elements.map(el => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type || 'N/A',
        text: el.textContent?.substring(0, 50),
        className: el.className,
        visible: el.offsetParent !== null
      }))
    );
    console.log('Login form elements:', loginFormElements);

    // Check register page  
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== REGISTER PAGE ===');
    console.log('URL:', page.url());
    
    const registerFormElements = await page.locator('form, input[type="email"], input[type="password"], button[type="submit"]').evaluateAll(elements =>
      elements.map(el => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type || 'N/A',
        text: el.textContent?.substring(0, 50),
        className: el.className,
        visible: el.offsetParent !== null
      }))
    );
    console.log('Register form elements:', registerFormElements);
  });
});