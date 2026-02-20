import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Sign In / Register Page
 *
 * Tests cover:
 *   - Page renders correctly in register and login mode
 *   - Form validation (password mismatch, short password, terms)
 *   - Mode toggle between "Sign In" and "Create Account"
 *   - Redirect for already-signed-in users
 */

test.describe('Auth Page — Sign In & Register', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/sign-in');
        // Wait for the page to be fully loaded (auth context resolves)
        await page.waitForLoadState('networkidle');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Register mode is the default
    // ─────────────────────────────────────────────────────────────────────────
    test('should show "Create an account" heading by default', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Logo / branding visible
    // ─────────────────────────────────────────────────────────────────────────
    test('should display ContestRemind branding', async ({ page }) => {
        await expect(page.getByText(/contestremind/i).first()).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Switching to Login mode
    // ─────────────────────────────────────────────────────────────────────────
    test('should switch to login mode when "Sign In" toggle is clicked', async ({ page }) => {
        await page.getByRole('button', { name: /^sign in$/i }).click();
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
        await expect(page.getByText(/sign in to your account/i)).toBeVisible();
        // Remember Me checkbox should appear in login mode
        await expect(page.getByText(/remember me/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Switching back to Register mode
    // ─────────────────────────────────────────────────────────────────────────
    test('should toggle back to register mode from login mode', async ({ page }) => {
        await page.getByRole('button', { name: /^sign in$/i }).click();
        await page.getByRole('button', { name: /create account/i }).click();
        await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Register — password mismatch validation
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error when passwords do not match (register)', async ({ page }) => {
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByPlaceholder('Create a strong password').fill('password123');
        await page.getByPlaceholder('Confirm your password').fill('differentPassword');

        // Accept Terms
        const checkboxes = page.locator('button[class*="rounded"][class*="border-2"]');
        await checkboxes.first().click();

        await page.getByRole('button', { name: /create account/i }).click();

        await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Register — short password validation
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error when password is too short (register)', async ({ page }) => {
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByPlaceholder('Create a strong password').fill('abc');
        await page.getByPlaceholder('Confirm your password').fill('abc');

        const checkboxes = page.locator('button[class*="rounded"][class*="border-2"]');
        await checkboxes.first().click();

        await page.getByRole('button', { name: /create account/i }).click();

        await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Register — terms of service validation
    // ─────────────────────────────────────────────────────────────────────────
    test('should require terms agreement before registration', async ({ page }) => {
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByPlaceholder('Create a strong password').fill('password123');
        await page.getByPlaceholder('Confirm your password').fill('password123');

        // Do NOT click Terms checkbox

        await page.getByRole('button', { name: /create account/i }).click();
        await expect(page.getByText(/agree to the terms/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Login — invalid credentials show error
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error for wrong credentials on login', async ({ page }) => {
        await page.getByRole('button', { name: /^sign in$/i }).click();

        await page.getByPlaceholder('you@example.com').fill('nobody@example.com');
        await page.getByPlaceholder('Enter your password').fill('WrongPassword999');
        await page.getByRole('button', { name: /sign in/i }).last().click();

        // Should show an error message (from backend)
        await expect(
            page.locator('[class*="red"]').filter({ hasText: /.+/ })
        ).toBeVisible({ timeout: 15_000 });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Password visibility toggle works
    // ─────────────────────────────────────────────────────────────────────────
    test('should toggle password visibility', async ({ page }) => {
        const passwordInput = page.getByPlaceholder('Create a strong password');
        await passwordInput.fill('mysecret');

        // By default it should be type=password (hidden)
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click the eye button to reveal
        await page.locator('button[tabindex="-1"]').first().click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide
        await page.locator('button[tabindex="-1"]').first().click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Terms of Service link is present
    // ─────────────────────────────────────────────────────────────────────────
    test('should display Terms of Service text in register form', async ({ page }) => {
        await expect(page.getByText(/terms of service/i).first()).toBeVisible();
    });
});
