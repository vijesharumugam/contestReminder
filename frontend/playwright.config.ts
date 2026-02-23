import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E Test Configuration for ContestRemind
 *
 * Requires:
 *   - Frontend: npm run dev  (http://localhost:3000)
 *   - Backend:  npm run dev  (http://localhost:5000)
 *
 * Run all tests:   npx playwright test
 * Run with UI:     npx playwright test --ui
 * Run one file:    npx playwright test tests/homepage.spec.ts
 * View report:     npx playwright show-report
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,   // run sequentially so auth tokens aren't shared across parallel workers
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html', { outputFolder: 'e2e-report', open: 'never' }], ['list']],

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        headless: true,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Start both dev servers automatically */
    webServer: [
        {
            command: 'npm.cmd run build && npm.cmd run start',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 300_000,
            cwd: process.cwd(),
        },
        {
            command: 'node server.js',
            url: 'http://localhost:5000',
            reuseExistingServer: true,
            timeout: 120_000,
            cwd: path.resolve(process.cwd(), '..', 'backend'),
            env: {
                ...process.env,
                TELEGRAM_BOT_TOKEN: '',
            },
        },
    ],
});
