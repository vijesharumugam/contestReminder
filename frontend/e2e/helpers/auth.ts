import { Page, expect } from '@playwright/test';

/**
 * Test credentials — use a dedicated test account that is safe to reuse.
 * Make sure this user exists in your dev database.
 */
export const TEST_USER = {
    email: 'kit27.ad59@gmail.com',
    password: 'Vijesh26@1',
};

export const ADMIN_USER = {
    email: process.env.E2E_ADMIN_EMAIL || 'vijesharumugam26@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD || '',
};

/**
 * Navigate to /sign-in and log in as the given user.
 * Waits until redirected back to the home page.
 */
export async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/sign-in');

    // Make sure we're on the login tab (not register)
    const signInToggle = page.getByRole('button', { name: 'Sign In' });
    if (await signInToggle.isVisible()) {
        await signInToggle.click();
    }

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: /Sign In/ }).last().click();

    // Should redirect to home after successful login
    await expect(page).toHaveURL('/', { timeout: 15_000 });
}

/**
 * Register a brand-new account via the sign-in page.
 */
export async function registerUser(
    page: Page,
    email: string,
    password: string
) {
    await page.goto('/sign-in');

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Create a strong password').fill(password);
    await page.getByPlaceholder('Confirm your password').fill(password);

    // Accept Terms of Service
    const tosCheckbox = page.locator('button').filter({ hasText: '' }).first();
    await tosCheckbox.click();

    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/', { timeout: 15_000 });
}
