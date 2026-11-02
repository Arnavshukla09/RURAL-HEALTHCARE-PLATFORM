import { test, expect } from '@playwright/test';

// Roles and their test credentials (read from env vars)
const ROLES = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@ruralhealth.demo',
    password: process.env.E2E_ADMIN_PASSWORD || ''
  },
  doctor: {
    email: process.env.E2E_DOCTOR_EMAIL || 'doctor@ruralhealth.demo',
    password: process.env.E2E_DOCTOR_PASSWORD || ''
  },
  patient: {
    email: process.env.E2E_PATIENT_EMAIL || 'patient@ruralhealth.demo',
    password: process.env.E2E_PATIENT_PASSWORD || ''
  }
};

// Helper function to log in
async function login(page: any, email: string, password: string) {
  page.on('console', (msg: any) => console.log('PAGE LOG:', msg.text()));
  await page.goto('/login');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL('**/dashboard**', { timeout: 25000 });
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
    test.skip(!ROLES.patient.password, 'E2E_PATIENT_PASSWORD not set');
    await login(page, ROLES.patient.email, ROLES.patient.password);
    
    // Verify Patient Dashboard Elements
    await expect(page.locator('text=My Care').first()).toBeVisible({ timeout: 15000 });
    
    // Test AI Symptom Checker Navigation
    const symptomCheckerBtn = page.locator('nav button:has-text("Symptoms")').first();
    if (await symptomCheckerBtn.isVisible()) {
      await symptomCheckerBtn.click();
      await expect(page.locator('text=Symptom').first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('Doctor Flow: Login and View Doctor Dashboard', async ({ page }) => {
    test.skip(!ROLES.doctor.password, 'E2E_DOCTOR_PASSWORD not set');
    await login(page, ROLES.doctor.email, ROLES.doctor.password);
    
    // Verify Doctor Dashboard Portal
    await expect(page.locator('text=Doctor Portal').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin Flow: Login and View Admin Controls', async ({ page }) => {
    test.skip(!ROLES.admin.password, 'E2E_ADMIN_PASSWORD not set');
    await login(page, ROLES.admin.email, ROLES.admin.password);
    
    // Admin should see Admin role badge and navigation
    await expect(page.locator('button:has-text("Users")').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('button:has-text("Campaigns")').first()).toBeVisible({ timeout: 15000 });
  });

  test('Security: Unauthenticated Access Prevented', async ({ page }) => {
    // Attempt to navigate to the dashboard directly without logging in
    await page.goto('/dashboard');
    // Should be redirected to /login or landing page
    await expect(page).not.toHaveURL('**/dashboard**');
    expect(page.url()).toContain('/login');
  });

});
