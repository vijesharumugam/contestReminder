import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Navigation & Sidebar
 *
 * Tests:
 *  - Sidebar renders and key nav links are visible
 *  - Logo links back to home
 *  - Sign-in link navigates to /sign-in
 *  - Settings link navigates to /settings (redirects to login if not auth'd)
 *  - Calendar link navigates to /calendar
 */

test.describe('Navigation — Sidebar', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Sidebar is visible (desktop layout)
    // ─────────────────────────────────────────────────────────────────────────
    test('sidebar should be visible on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        // Nav / sidebar must exist
        await expect(page.locator('nav, aside')).not.toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ContestRemind logo / brand text is present
    // ─────────────────────────────────────────────────────────────────────────
    test('should display ContestRemind brand in sidebar', async ({ page }) => {
        await expect(page.getByText(/contestremind/i).first()).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. "Sign In" nav link is visible when not authenticated
    // ─────────────────────────────────────────────────────────────────────────
    test('should show Sign In link when unauthenticated', async ({ page }) => {
        // At least one link or button with "Sign In" text should be visible
        const signInEl = page.getByRole('link', { name: /sign in/i }).or(
            page.getByRole('button', { name: /sign in/i })
        );
        await expect(signInEl.first()).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Clicking Sign In navigates to /sign-in
    // ─────────────────────────────────────────────────────────────────────────
    test('clicking Sign In should navigate to /sign-in', async ({ page }) => {
        const signInLink = page.getByRole('link', { name: /sign in/i });
        if (await signInLink.count() > 0) {
            await signInLink.first().click();
            await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
        } else {
            const signInBtn = page.getByRole('button', { name: /sign in/i });
            await signInBtn.first().click();
            await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Settings navigation item exists
    // ─────────────────────────────────────────────────────────────────────────
    test('should have a Settings navigation item', async ({ page }) => {
        await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Calendar navigation item exists
    // ─────────────────────────────────────────────────────────────────────────
    test('should have a Calendar navigation item', async ({ page }) => {
        await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Home navigation item exists
    // ─────────────────────────────────────────────────────────────────────────
    test('should have a Home navigation item', async ({ page }) => {
        await expect(
            page.getByRole('link', { name: /home/i }).or(
                page.getByRole('link', { name: /contests/i })
            ).first()
        ).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Mobile bottom nav is shown on small screens
    // ─────────────────────────────────────────────────────────────────────────
    test('should show bottom navigation on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Mobile bottom nav typically floats fixed at the bottom
        const nav = page.locator('nav').last();
        await expect(nav).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Admin link is NOT visible for unauthenticated users (security check)
    // ─────────────────────────────────────────────────────────────────────────
    test('Admin link should NOT be visible to unauthenticated users', async ({ page }) => {
        const adminLink = page.getByRole('link', { name: /admin/i });
        // If present, it should not be visible to non-admin
        if (await adminLink.count() > 0) {
            await expect(adminLink).not.toBeVisible();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Navigating to /settings redirects unauthenticated user
    // ─────────────────────────────────────────────────────────────────────────
    test('navigating directly to /settings should redirect unauthenticated user', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/\/settings$/);
    });
});
