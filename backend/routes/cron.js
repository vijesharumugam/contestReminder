const express = require('express');
const router = express.Router();
const { fetchAndSaveContests, sendDailyDigest, sendUpcomingReminders } = require('../services/scheduler');

// Security middleware - verify cron secret
const verifyCronSecret = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        return res.status(500).json({ error: 'CRON_SECRET not configured' });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// Cron endpoint: Fetch contests every 6 hours
router.get('/fetch-contests', verifyCronSecret, async (req, res) => {
    try {
        console.log('Cron triggered: Fetching contests...');
        await fetchAndSaveContests();
        res.json({ success: true, message: 'Contests fetched successfully' });
    } catch (error) {
        console.error('Cron error (fetch-contests):', error);
        res.status(500).json({ error: error.message });
    }
});

// Cron endpoint: Send daily digest at 8 AM
router.get('/daily-digest', verifyCronSecret, async (req, res) => {
    try {
        console.log('Cron triggered: Sending daily digest...');
        await sendDailyDigest();
        res.json({ success: true, message: 'Daily digest sent successfully' });
    } catch (error) {
        console.error('Cron error (daily-digest):', error);
        res.status(500).json({ error: error.message });
    }
});

// Cron endpoint: Check for 30-minute reminders every 5 minutes
router.get('/upcoming-reminders', verifyCronSecret, async (req, res) => {
    try {
        console.log('Cron triggered: Checking upcoming reminders...');
        await sendUpcomingReminders();
        res.json({ success: true, message: 'Reminders checked and sent' });
    } catch (error) {
        console.error('Cron error (upcoming-reminders):', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
