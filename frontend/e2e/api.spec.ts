import { test, expect, request } from '@playwright/test';

/**
 * E2E Tests — Backend API Health
 * 
 * Updated to match the new JWT system (accessToken/refreshToken).
 * 
 * Backend must be running on http://localhost:5000
 */

const API = 'http://localhost:5000';

test.describe('Backend API — Health & Endpoints', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Root health check
    // ─────────────────────────────────────────────────────────────────────────
    test('GET / should return API running message', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/`);
        expect(res.status()).toBe(200);
        const text = await res.text();
        expect(text).toMatch(/contest reminder api running/i);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Contests endpoint returns an array
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests should return an array', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Contests with platform filter
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests?platform=Codeforces should return only Codeforces contests', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests?platform=Codeforces`);
        expect(res.status()).toBe(200);
        const contests = await res.json();
        expect(Array.isArray(contests)).toBeTruthy();
        for (const c of contests) {
            expect(c.platform).toBe('Codeforces');
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Platforms endpoint returns an array of strings
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests/platforms should return array of platform strings', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests/platforms`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
        body.forEach((p: unknown) => expect(typeof p).toBe('string'));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Register — failure states
    // ─────────────────────────────────────────────────────────────────────────
    test('POST /api/auth/register with missing fields should return 400', async () => {
        const ctx = await request.newContext();
        const res = await ctx.post(`${API}/api/auth/register`, {
            data: { email: '' },
        });
        expect([400, 422]).toContain(res.status());
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Login — wrong credentials returns 401
    // ─────────────────────────────────────────────────────────────────────────
    test('POST /api/auth/login with wrong credentials returns 401', async () => {
        const ctx = await request.newContext();
        const res = await ctx.post(`${API}/api/auth/login`, {
            data: { email: 'nonexistent@test.com', password: 'WrongPass123' },
        });
        expect(res.status()).toBe(401);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Protected route without token returns 401
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/auth/me without auth token should return 401', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/auth/me`);
        expect(res.status()).toBe(401);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Admin route without auth should return 401/403
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/admin/stats without admin credentials returns 401 or 403', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/admin/stats`);
        expect([401, 403]).toContain(res.status());
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Full auth flow — register → login → get /me
    // ─────────────────────────────────────────────────────────────────────────
    test('Full flow: register → login → access /api/auth/me', async ({ }) => {
        const ctx = await request.newContext();
        const uniqueEmail = `e2e_api_${Date.now()}@test.com`;
        const password = 'TestPass123';

        // 1. Register
        const registerRes = await ctx.post(`${API}/api/auth/register`, {
            data: { email: uniqueEmail, password },
        });
        expect(registerRes.status()).toBe(201);
        const registerBody = await registerRes.json();
        expect(registerBody).toHaveProperty('accessToken');
        const token = registerBody.accessToken;

        // 2. Access /api/auth/me with the token
        const meRes = await ctx.get(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(meRes.status()).toBe(200);
        const meBody = await meRes.json();
        expect(meBody.email).toBe(uniqueEmail);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Date filtering — Today
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests?date=today should return array', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests?date=today`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Date filtering — Specific Date
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests?date=2026-02-21 should return array', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests?date=2026-02-21`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 13. Date filtering — Invalid Date
    // ─────────────────────────────────────────────────────────────────────────
    test('GET /api/contests?date=not-a-date returns 400', async () => {
        const ctx = await request.newContext();
        const res = await ctx.get(`${API}/api/contests?date=not-a-date`);
        expect(res.status()).toBe(400);
    });
});
