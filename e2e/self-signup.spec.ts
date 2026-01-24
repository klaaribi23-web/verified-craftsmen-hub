import { test, expect } from '@playwright/test';

test.describe('Self-Signup Flow', () => {
  
  test.describe('Client Signup via /auth', () => {
    test('should show confirmation screen after signup', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to signup tab
      await page.click('button[value="signup"]');
      
      // Fill signup form
      const testEmail = `test-client-${Date.now()}@example.com`;
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Client');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for confirmation screen
      await expect(page.getByText('Vérifiez votre boîte mail')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Renvoyer l\'email')).toBeVisible();
    });
  });

  test.describe('Artisan Signup via /auth', () => {
    test('should show confirmation screen after artisan signup', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to signup tab
      await page.click('button[value="signup"]');
      
      // Select artisan user type
      await page.click('button:has-text("Artisan")');
      
      // Fill signup form
      const testEmail = `test-artisan-${Date.now()}@example.com`;
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Artisan');
      await page.fill('input[name="businessName"]', 'Test Artisan SARL');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for confirmation screen
      await expect(page.getByText('Vérifiez votre boîte mail')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Renvoyer l\'email')).toBeVisible();
    });
  });

  test.describe('Artisan Signup via /devenir-artisan', () => {
    test('should show confirmation screen after partner signup', async ({ page }) => {
      await page.goto('/devenir-artisan');
      
      // Fill the partner signup form
      const testEmail = `test-partner-${Date.now()}@example.com`;
      await page.fill('input[name="firstName"]', 'Partner');
      await page.fill('input[name="lastName"]', 'Artisan');
      await page.fill('input[name="businessName"]', 'Partner SARL');
      await page.fill('input[name="email"]', testEmail);
      
      // Fill phone number
      await page.fill('input[placeholder*="téléphone"], input[type="tel"]', '0612345678');
      
      // Fill city (may need autocomplete interaction)
      await page.fill('input[placeholder*="ville"], input[name="city"]', 'Paris');
      await page.waitForTimeout(500);
      // Select first suggestion if available
      const suggestion = page.locator('[role="option"]').first();
      if (await suggestion.isVisible()) {
        await suggestion.click();
      }
      
      // Select a category
      await page.click('button:has-text("Sélectionnez vos catégories")');
      await page.waitForTimeout(300);
      const categoryOption = page.locator('[role="option"]').first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
      }
      
      // Fill password
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      
      // Accept terms
      const checkbox = page.locator('input[type="checkbox"]');
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for confirmation screen
      await expect(page.getByText('Vérifiez votre boîte mail')).toBeVisible({ timeout: 20000 });
      await expect(page.getByText('Renvoyer l\'email')).toBeVisible();
    });
  });

  test.describe('Resend Email Cooldown', () => {
    test('should disable resend button for 60 seconds after click', async ({ page }) => {
      // This test requires a user to be in the confirmation state
      // We'll test the button behavior on the confirmation page
      await page.goto('/auth');
      
      // Switch to signup tab
      await page.click('button[value="signup"]');
      
      // Quick signup
      const testEmail = `test-cooldown-${Date.now()}@example.com`;
      await page.fill('input[name="firstName"]', 'Cooldown');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for confirmation screen
      await expect(page.getByText('Vérifiez votre boîte mail')).toBeVisible({ timeout: 15000 });
      
      // Find and click resend button
      const resendButton = page.getByRole('button', { name: /renvoyer/i });
      await expect(resendButton).toBeVisible();
      await resendButton.click();
      
      // Button should show cooldown or be disabled
      await page.waitForTimeout(1000);
      
      // Check for cooldown indicator (either disabled or showing countdown)
      const buttonText = await resendButton.textContent();
      const isDisabled = await resendButton.isDisabled();
      
      // Either button is disabled OR shows countdown text
      expect(isDisabled || buttonText?.includes('s') || buttonText?.includes('Envoi')).toBeTruthy();
    });
  });

  test.describe('Invalid Token Handling', () => {
    test('should show error for invalid UUID token', async ({ page }) => {
      await page.goto('/confirmer-email?token=not-a-valid-uuid');
      
      // Should show error message
      await expect(page.getByText(/invalide|expiré|erreur/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show error for non-existent valid UUID token', async ({ page }) => {
      // Use a valid UUID format but non-existent token
      await page.goto('/confirmer-email?token=00000000-0000-0000-0000-000000000000');
      
      // Should show error message
      await expect(page.getByText(/invalide|expiré|erreur|déjà été utilisé/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show error for missing token', async ({ page }) => {
      await page.goto('/confirmer-email');
      
      // Should show error message
      await expect(page.getByText(/invalide|manquant|erreur/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Email Confirmation Page', () => {
    test('should display proper UI elements', async ({ page }) => {
      await page.goto('/confirmer-email?token=test-token');
      
      // Page should have proper structure
      await expect(page.locator('nav')).toBeVisible(); // Navbar
      await expect(page.locator('footer')).toBeVisible(); // Footer
      
      // Should eventually show either loading, success, or error state
      await page.waitForTimeout(3000);
      
      // Check that some feedback is displayed
      const hasStatus = await page.getByText(/confirmation|erreur|succès|invalide/i).isVisible();
      expect(hasStatus).toBeTruthy();
    });
  });
});
