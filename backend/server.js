// Load environment variables FIRST before any other imports
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env-specific files first (e.g. .env.production), then generic .env.
const envName = process.env.NODE_ENV;
[
    envName ? path.resolve(__dirname, `.env.${envName}`) : null,
    path.resolve(__dirname, '.env'),
    envName ? path.resolve(__dirname, `../.env.${envName}`) : null,
    path.resolve(__dirname, '../.env'),
].filter(Boolean).forEach((envPath) => {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: false, quiet: true });
    }
});

// Core dependencies
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');

// Internal modules
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');
const { fetchAndSaveContests, UPCOMING_CONTEST_LIMIT: FETCH_BATCH_SIZE } = require('./services/clistService');
const { sendDailyDigest, sendUpcomingReminders } = require('./services/scheduler');
const { initializeFirebase } = require('./services/fcmService');
const { authenticate, isAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Initialize Firebase for FCM
initializeFirebase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Contest Reminder API Running');
});

const runContestSync = async (reason = 'manual') => {
    console.log(`[Sync] Contest sync started (${reason})...`);
    const stats = await fetchAndSaveContests();
    console.log(`[Sync] Contest sync finished (${reason}).`, stats);
    return stats;
};

// Manual trigger for admins
app.get('/api/trigger-fetch', authenticate, isAdmin, async (req, res) => {
    try {
        const stats = await runContestSync('manual_trigger');
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Initialize Cron Jobs
const initScheduledJobs = () => {
    console.log('[Scheduler] Initializing scheduled jobs...');

    // 1. Fetch and store upcoming contests once per day (00:10 AM IST)
    // Fetches in batches (default 200 per batch) and stores all fetched upcoming contests.
    cron.schedule('10 0 * * *', async () => {
        try {
            await runContestSync('daily_cron');
        } catch (error) {
            console.error('[Cron] Contest sync failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // 2. Daily Digest: 08:00 AM IST
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Sending daily digest via Telegram...');
        await sendDailyDigest();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // 3. 30-min Reminder: Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[Cron] Checking for 30-minute reminders...');
        await sendUpcomingReminders();
    });

    // 4. Keep-Alive: Ping self every 14 minutes (prevents Render free tier sleep which happens after 15 mins)
    if (process.env.NODE_ENV === 'production') {
        const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'https://contestreminder-krrf.onrender.com';

        cron.schedule('*/14 * * * *', async () => {
            try {
                console.log(`[Keep-Alive] Pinging self at ${new Date().toISOString()}...`);
                await axios.get(SELF_URL);
                console.log('[Keep-Alive] ✅ Pinged self successfully');
            } catch (error) {
                console.error('[Keep-Alive] ❌ Ping failed:', error.message);
            }
        });

        console.log(`[Keep-Alive] Enabled - pinging ${SELF_URL} every 14 minutes`);
    }

    console.log('[Scheduler] ✅ All jobs initialized successfully');
    console.log(`[Scheduler] Contest sync: daily at 00:10 IST, fetch batch size: ${FETCH_BATCH_SIZE}`);
};

// Start Server & Scheduler
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🚀 Contest Reminder API`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Notifications: Push + FCM + Telegram`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);


    // Initialize scheduled jobs
    initScheduledJobs();

    // Run one sync on startup so data is immediately available without waiting for next cron.
    runContestSync('startup').catch((error) => {
        console.error('[Startup] Initial contest sync failed:', error.message);
    });
});

// Force restart trigger
module.exports = app;
