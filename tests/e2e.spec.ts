import { test, expect } from '@playwright/test';

test.describe('Next.js App Router E2E', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the title exists
    await expect(page).toHaveTitle(/Rural/i);
    
    // Verify that the logo/header is present
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify the primary CTA is visible (Get Started)
    const getStartedBtn = page.getByRole('button', { name: /Get Started|शुरू करें/i }).first();
    await expect(getStartedBtn).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form exists
    const loginHeading = page.getByRole('heading', { name: /Login/i }).first();
    await expect(loginHeading).toBeVisible();
    
    // Check that email input exists
    const emailInput = page.getByPlaceholder(/Email/i).first();
    await expect(emailInput).toBeVisible();
  });

  test('should navigate to symptom checker', async ({ page }) => {
    await page.goto('/symptom-checker');
    
    const checkerHeading = page.getByRole('heading', { name: /Symptom/i }).first();
    await expect(checkerHeading).toBeVisible();
  });
});
