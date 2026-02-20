import { test, expect } from '@playwright/test';
import { loginAs, TEST_USER } from './helpers/auth';

/**
 * E2E Tests — Settings Page
 *
 * Covers:
 *   - Page requires authentication (redirects if not logged in)
 *   - Settings page content for authenticated user
 *   - Telegram section visibility
 *   - Account & Security section
 *   - Change password form validation
 *   - Delete account danger zone
 *
 * NOTE: These tests require a real test user in the database.
 * Create one via the sign-up flow or seed the database.
 * Set TEST_USER credentials in e2e/helpers/auth.ts.
 */

test.describe('Settings Page — Authenticated', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, TEST_USER.email, TEST_USER.password);
        await page.goto('/settings');
        // Wait for settings content to load
        await page.waitForLoadState('networkidle');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Settings heading is visible
    // ─────────────────────────────────────────────────────────────────────────
    test('should display "Notifications" heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible({ timeout: 10_000 });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Telegram section is visible
    // ─────────────────────────────────────────────────────────────────────────
    test('should show Telegram notification section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /telegram/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Telegram connect button or connected status shows
    // ─────────────────────────────────────────────────────────────────────────
    test('should show Telegram connect button or connected status', async ({ page }) => {
        const connectBtn = page.getByRole('link', { name: /connect telegram/i });
        const connectedBadge = page.getByText(/connected/i);

        const isConnectVisible = await connectBtn.isVisible();
        const isConnectedVisible = await connectedBadge.isVisible();

        expect(isConnectVisible || isConnectedVisible).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Account & Security section is visible
    // ─────────────────────────────────────────────────────────────────────────
    test('should show Account & Security section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /account & security/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Change Password form elements are present
    // ─────────────────────────────────────────────────────────────────────────
    test('should render Change Password form fields', async ({ page }) => {
        await expect(page.getByPlaceholder('Enter current password')).toBeVisible();
        await expect(page.getByPlaceholder('Min 6 characters')).toBeVisible();
        await expect(page.getByPlaceholder('Re-enter new password')).toBeVisible();
        await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Change Password — mismatched passwords shows error
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error when new passwords do not match', async ({ page }) => {
        await page.getByPlaceholder('Enter current password').fill('currentPass123');
        await page.getByPlaceholder('Min 6 characters').fill('newPass123');
        await page.getByPlaceholder('Re-enter new password').fill('differentPass999');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(page.getByText(/do not match/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Change Password — short new password shows error
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error when new password is less than 6 characters', async ({ page }) => {
        await page.getByPlaceholder('Enter current password').fill('currentPass123');
        await page.getByPlaceholder('Min 6 characters').fill('abc');
        await page.getByPlaceholder('Re-enter new password').fill('abc');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Danger Zone — Delete Account button opens confirmation dialog
    // ─────────────────────────────────────────────────────────────────────────
    test('should open delete account confirmation dialog', async ({ page }) => {
        await page.getByRole('button', { name: /delete account/i }).click();

        // Modal with warning text should appear
        await expect(page.getByRole('heading', { name: /delete your account\?/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /delete forever/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Delete account dialog — Cancel closes the dialog
    // ─────────────────────────────────────────────────────────────────────────
    test('should close delete dialog when Cancel is clicked', async ({ page }) => {
        await page.getByRole('button', { name: /delete account/i }).click();
        await expect(page.getByRole('heading', { name: /delete your account\?/i })).toBeVisible();

        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByRole('heading', { name: /delete your account\?/i })).not.toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Delete account — requires password to confirm
    // ─────────────────────────────────────────────────────────────────────────
    test('should show error when Delete Forever is clicked without password', async ({ page }) => {
        await page.getByRole('button', { name: /delete account/i }).click();
        await expect(page.getByRole('heading', { name: /delete your account\?/i })).toBeVisible();

        // Click Delete Forever without filling the password
        await page.getByRole('button', { name: /delete forever/i }).click();

        await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Feature highlights section is shown
    // ─────────────────────────────────────────────────────────────────────────
    test('should display Morning Digest and 30-Min Heads Up feature cards', async ({ page }) => {
        await expect(page.getByText(/morning digest/i)).toBeVisible();
        await expect(page.getByText(/30-min heads up/i)).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Guards — Unauthenticated user redirected away from /settings
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Settings Page — Unauthenticated', () => {

    test('should redirect unauthenticated user away from /settings', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // AuthGuard redirects to home or sign-in if not signed in
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/settings');
    });
});
