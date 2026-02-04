// Load environment variables FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Core dependencies
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');

// Internal modules
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');
const { fetchAndSaveContests } = require('./services/clistService');
const { sendDailyDigest, sendUpcomingReminders } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Contest Reminder API Running');
});

// Manual trigger for testing (Optional)
app.get('/api/trigger-fetch', async (req, res) => {
    await fetchAndSaveContests();
    res.send('Fetch triggered');
});

// Initialize Cron Jobs
const initScheduledJobs = () => {
    console.log('[Scheduler] Initializing scheduled jobs...');

    // 1. Fetch Contests: Every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('[Cron] Fetching contests from CLIST API...');
        await fetchAndSaveContests();
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
};

// Start Server & Scheduler
app.listen(PORT, async () => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🚀 Contest Reminder API`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Notifications: Telegram Only`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Initialize scheduled jobs
    initScheduledJobs();
});

module.exports = app;
