const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const loadEnv = () => {
    const envName = process.env.NODE_ENV;
    [
        envName ? path.resolve(__dirname, `../.env.${envName}`) : null,
        path.resolve(__dirname, '../.env'),
        envName ? path.resolve(__dirname, `../../.env.${envName}`) : null,
        path.resolve(__dirname, '../../.env'),
    ]
        .filter(Boolean)
        .forEach((envPath) => {
            if (fs.existsSync(envPath)) {
                dotenv.config({ path: envPath, override: false, quiet: true });
            }
        });
};

const run = async () => {
    loadEnv();

    const { fetchAndSaveContests } = require('../services/clistService');

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing. Add it to your environment or .env file.');
    }

    if (!process.env.CLIST_USERNAME || !process.env.CLIST_API_KEY) {
        throw new Error('CLIST_USERNAME / CLIST_API_KEY are missing. Cannot re-sync contest times.');
    }

    const startedAt = new Date();
    console.log(`[FixContestTimes] Started at ${startedAt.toISOString()}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[FixContestTimes] Connected to MongoDB');

    const stats = await fetchAndSaveContests();
    console.log('[FixContestTimes] Re-sync complete:', stats);

    if (!stats || stats.fetched === 0) {
        console.warn('[FixContestTimes] No contests were fetched. Timing repair did not run on old records.');
        console.warn('[FixContestTimes] Check CLIST credentials and retry.');
    }

    await mongoose.disconnect();
    console.log('[FixContestTimes] Disconnected from MongoDB');
};

run()
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error('[FixContestTimes] Failed:', err.message);
        try {
            await mongoose.disconnect();
        } catch (_) {
            // ignore disconnect failures
        }
        process.exit(1);
    });
