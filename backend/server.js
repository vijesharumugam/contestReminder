// Load environment variables FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Core dependencies
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

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

// Initialize Cron Jobs (Render supports this!)
const initScheduledJobs = () => {
    console.log("Initializing Scheduler...");

    // 1. Fetch Contests: Every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log("Cron: Fetching Contests...");
        await fetchAndSaveContests();
    });

    // 2. Daily Digest: 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log("Cron: Sending Daily Digest...");
        await sendDailyDigest();
    });

    // 3. 30-min Reminder: Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log("Cron: Checking 30-min Reminders...");
        await sendUpcomingReminders();
    });
};

// Start Server & Scheduler
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initScheduledJobs();
});

module.exports = app;
