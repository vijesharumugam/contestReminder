import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Home Page (Contest Listing)
 */

test.describe('Home Page — Contest Listing & Filtering', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('Core sections should be visible', async ({ page }) => {
        await expect(page.getByText(/today's contests/i).first()).toBeVisible();
        await expect(page.getByText(/upcoming contests/i).first()).toBeVisible();
    });

    test('Loading should complete', async ({ page }) => {
        const contestCards = page.locator('[data-testid="contest-card"]');
        const emptyState = page.getByText(/no contests today/i).or(page.getByText(/no upcoming contests/i));
        await expect(contestCards.first().or(emptyState.first())).toBeVisible({ timeout: 20_000 });
    });

    test('Platform filter interaction', async ({ page }) => {
        // Try to find any platform button that isn't "All"
        const platformBtn = page.locator('button').filter({ hasText: /^Codeforces$/i }).or(page.locator('button').filter({ hasText: /^CodeChef$/i }));

        if (await platformBtn.count() > 0) {
            await platformBtn.first().click();
            await page.waitForTimeout(500);
            const cards = page.locator('[data-testid="contest-card"]');
            const empty = page.getByText(/no upcoming contests/i);
            await expect(cards.first().or(empty.first())).toBeVisible();
        }
    });

    test('Date Filter Interaction', async ({ page }) => {
        // Look for the date filter button specifically by icon if text is problematic
        const dateBtn = page.locator('button').filter({ hasText: /date/i }).or(page.locator('button:has(svg.lucide-calendar-days)'));
        await dateBtn.first().click();

        await expect(page.getByText(/select date/i)).toBeVisible();

        const tomorrowBtn = page.getByRole('button', { name: 'Tomorrow' });
        if (await tomorrowBtn.isVisible()) {
            await tomorrowBtn.click();
            await expect(page.getByText(/select date/i)).not.toBeVisible();
            // Look for the reset 'X' button or the active filter indicator
            await expect(page.locator('button').filter({ has: page.locator('svg.lucide-x') }).or(page.getByText(/tomorrow/i))).toBeVisible();
        }
    });

    test('Clear all behavior', async ({ page }) => {
        // Apply platform filter
        const cfBtn = page.locator('button').filter({ hasText: /^Codeforces$/i });
        if (await cfBtn.count() > 0) {
            await cfBtn.first().click();
            const clearBtn = page.getByRole('button', { name: /clear all/i });
            await expect(clearBtn).toBeVisible();
            await clearBtn.click();
            await expect(clearBtn).not.toBeVisible();
        }
    });
});
