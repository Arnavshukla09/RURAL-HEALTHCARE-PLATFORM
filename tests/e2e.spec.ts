import { test, expect } from '@playwright/test';

// Roles and their test credentials
const ROLES = {
  admin: { email: 'admin@ruralhealth.com', password: 'Admin@123' },
  doctor: { email: 'doctor@ruralhealth.com', password: 'Doctor@123' },
  patient: { email: 'patient@ruralhealth.com', password: 'Patient@123' }
};

// Helper function to log in
async function login(page, email, password) {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('/login');
  // Usually, unauthenticated users are shown the login page directly or via a login button.
  await page.goto('/login');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  } catch (e) {
    const pageText = await page.innerText('body');
    const toastText = await page.locator('ol[data-sonner-toaster]').innerText().catch(() => 'No toast found');
    throw new Error(`Failed to navigate to dashboard. Toast text: ${toastText}. Page text: ${pageText}`);
  }
}

test.describe('End-to-End Tests for Rural Healthcare Platform', () => {

  test('Public Pages Load Successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rural/i);
    // Basic structural checks
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Patient Flow: Login, View Dashboard, Check Symptoms', async ({ page }) => {
    await login(page, ROLES.patient.email, ROLES.patient.password);
    
    // Verify Patient Dashboard Elements
    await expect(page.locator('text=My Care').first()).toBeVisible();
    
    // Test AI Symptom Checker Navigation
    const symptomCheckerCard = page.locator('text=Symptom Checker').first();
    if (await symptomCheckerCard.isVisible()) {
      await symptomCheckerCard.click();
      await expect(page.locator('text=Where are you experiencing discomfort?').first()).toBeVisible();
    }
  });

  test('Doctor Flow: Login and View Doctor Dashboard', async ({ page }) => {
    await login(page, ROLES.doctor.email, ROLES.doctor.password);
    
    
    // Check Appointments section
    await page.click('text=Appointments');
    await expect(page.locator('text=Scheduled').first()).toBeVisible();
  });

  test('Admin Flow: Login and View Admin Controls', async ({ page }) => {
    await login(page, ROLES.admin.email, ROLES.admin.password);
    
    // Admin should see Admin-specific text or controls
    await expect(page.locator('text=Admin').first()).toBeVisible();
    
    // Verify access to Medical Records system-wide
    await page.click('text=Medical Records');
    // Admin shouldn't see patient-only sections if implemented that way, but let's check a basic admin element
    await expect(page.locator('text=RuralHealth').first()).toBeVisible();
  });

  test('Security: Unauthenticated Access Prevented', async ({ page }) => {
    // Attempt to navigate to the dashboard directly without logging in
    await page.goto('/dashboard');
    // Should be redirected to /login or landing page
    await expect(page).not.toHaveURL('**/dashboard**');
    expect(page.url()).toContain('/login');
  });

});
