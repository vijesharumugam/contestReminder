import { Page, expect } from '@playwright/test';

/**
 * Test credentials — use a dedicated test account that is safe to reuse.
 * Make sure this user exists in your dev database.
 */
export const TEST_USER = {
    email: process.env.E2E_TEST_EMAIL || 'test@example.com',
    password: process.env.E2E_TEST_PASSWORD || 'TestPass123!',
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
    if (!email || !password) {
        throw new Error('E2E credentials are missing.');
    }

    await page.goto('/sign-in');

    // If already authenticated, /sign-in redirects away and fields won't be present.
    if (!page.url().includes('/sign-in')) {
        return;
    }

    // Make sure we're on the login tab (not register)
    const signInToggle = page.getByRole('button', { name: 'Sign In' });
    if (await signInToggle.isVisible()) {
        await signInToggle.click();
    }

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: /Sign In/ }).last().click();

    // If login fails because user does not exist, register and retry login
    const loginError = page.locator('div').filter({ hasText: /invalid email or password/i }).first();
    try {
        await expect(page).toHaveURL('/', { timeout: 8_000 });
        return;
    } catch {
        if (await loginError.isVisible().catch(() => false)) {
            await registerUser(page, email, password);
            await page.goto('/sign-in');
            if (!page.url().includes('/sign-in')) {
                return;
            }
            const signInToggleAgain = page.getByRole('button', { name: 'Sign In' });
            if (await signInToggleAgain.isVisible()) {
                await signInToggleAgain.click();
            }
            await page.getByPlaceholder('you@example.com').fill(email);
            await page.getByPlaceholder('Enter your password').fill(password);
            await page.getByRole('button', { name: /Sign In/ }).last().click();
        }
    }

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
    const termsText = page.getByText(/i agree to the/i).first();
    const termsContainer = termsText.locator('xpath=..');
    await termsContainer.locator('button').first().click();

    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/', { timeout: 15_000 });
}
