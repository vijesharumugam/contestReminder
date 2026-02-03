const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendTelegramMessage } = require('../services/telegramService');

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

// Middleware to check if the request comes from the admin
const isAdmin = (req, res, next) => {
    const requesterEmail = req.headers['x-admin-email'];
    if (requesterEmail === ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).json({ error: "Access Denied: Admins Only" });
    }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test Telegram
router.post('/test-telegram', isAdmin, async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: "No Chat ID linked" });
    try {
        await sendTelegramMessage(chatId, "🔔 Test Notification: This is a test message from your Contest Reminder System.");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
