// Load environment variables FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Core dependencies
const express = require('express');
const cors = require('cors');

// Internal modules
const connectDB = require('./config/db');
const { initScheduledJobs, sendDailyDigest, sendUpcomingReminders } = require('./services/scheduler');
const userRoutes = require('./routes/users');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');
const { fetchAndSaveContests } = require('./services/clistService');
const { handleWebhookUpdate } = require('./services/telegramService');

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

// Vercel Cron Routes (Protected by CRON_SECRET if desired, currently open for simplicity or secret query param recommended)
app.get('/api/cron/fetch', async (req, res) => {
    await fetchAndSaveContests();
    res.json({ success: true, message: 'Contests fetched' });
});

app.get('/api/cron/digest', async (req, res) => {
    await sendDailyDigest();
    res.json({ success: true, message: 'Daily digest sent' });
});

app.get('/api/cron/reminders', async (req, res) => {
    await sendUpcomingReminders();
    res.json({ success: true, message: 'Reminders check complete' });
});

// Telegram Webhook Route
app.post('/api/telegram/webhook', (req, res) => {
    handleWebhookUpdate(req.body);
    res.sendStatus(200);
});

// Start Server (Only for local dev, Vercel handles this via export)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        initScheduledJobs(); // Only run node-cron locally
    });
}

// Export app for Vercel
module.exports = app;
