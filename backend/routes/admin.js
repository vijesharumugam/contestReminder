const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendTelegramMessage } = require('../services/telegramService');
const { sendPushToUser } = require('../services/pushService');

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
        await sendTelegramMessage(chatId, "🔔 *Test Notification*\n━━━━━━━━━━━━━━━━━━━━\n\nThis is a test message from your Contest Reminder System.\n\n✅ Telegram notifications are working correctly!");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test Push Notification
router.post('/test-push', isAdmin, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "No userId provided" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            return res.status(400).json({ error: "User has no push subscriptions" });
        }

        const payload = {
            type: 'test',
            title: '🔔 Test Notification',
            body: 'Push notifications are working correctly! You will receive contest reminders here.',
            icon: '/icons/icon-192x192.svg',
            badge: '/icons/icon-192x192.svg',
            data: { url: '/' }
        };

        await sendPushToUser(user, payload);
        res.json({ success: true, subscriptionCount: user.pushSubscriptions.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send custom notification to a specific user (push + telegram)
router.post('/send-notification', isAdmin, async (req, res) => {
    const { userId, title, message, channel } = req.body;
    if (!userId || !title || !message) {
        return res.status(400).json({ error: "Missing userId, title, or message" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const results = { push: false, telegram: false };

        // Send push if requested and available
        if ((channel === 'all' || channel === 'push') && user.pushSubscriptions?.length > 0) {
            const payload = {
                type: 'custom',
                title,
                body: message,
                icon: '/icons/icon-192x192.svg',
                badge: '/icons/icon-192x192.svg',
                data: { url: '/' }
            };
            await sendPushToUser(user, payload);
            results.push = true;
        }

        // Send telegram if requested and available
        if ((channel === 'all' || channel === 'telegram') && user.telegramChatId) {
            await sendTelegramMessage(user.telegramChatId, `🔔 *${title}*\n━━━━━━━━━━━━━━━━━━━━\n\n${message}`);
            results.telegram = true;
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
