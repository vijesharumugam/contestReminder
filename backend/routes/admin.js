const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contest = require('../models/Contest');
const NotificationLog = require('../models/NotificationLog');
const { sendTelegramMessage } = require('../services/telegramService');
const { sendFCMToUser } = require('../services/fcmService');
const { authenticate, isAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(isAdmin);

// --- READ OPERATIONS ---

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeFCM = await User.countDocuments({ "fcmTokens.0": { $exists: true } });
        const activeTelegram = await User.countDocuments({ telegramChatId: { $ne: null } });

        const now = new Date();
        const upcomingContests = await Contest.countDocuments({ startTime: { $gte: now } });
        const totalContests = await Contest.countDocuments();

        const lastLog = await NotificationLog.findOne().sort({ sentAt: -1 }).lean();

        res.json({
            users: { total: totalUsers, fcm: activeFCM, telegram: activeTelegram },
            contests: { total: totalContests, upcoming: upcomingContests },
            lastRun: lastLog ? lastLog.sentAt : null,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 }); // Newest first
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Recent Logs (Last 50)
router.get('/logs', async (req, res) => {
    try {
        const logs = await NotificationLog.find({})
            .sort({ sentAt: -1 })
            .limit(50)
            .populate('userId', 'email') // Populate user email if possible
            .populate('contestId', 'name platform');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ACTIONS ---

// Test Telegram
router.post('/test-telegram', async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: "No Chat ID linked" });
    try {
        await sendTelegramMessage(chatId, "🔔 *Test Notification*\n━━━━━━━━━━━━━━━━━━━━\n\nThis is a test message from your Contest Reminder System.\n\n✅ Telegram notifications are working correctly!");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test FCM Notification (Native App)
router.post('/test-fcm', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "No userId provided" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.fcmTokens || user.fcmTokens.length === 0) {
            return res.status(400).json({ error: "User has no FCM tokens (native app not installed)" });
        }

        const result = await sendFCMToUser(user,
            '🔔 Test Notification',
            'Native push notifications are working! You will receive contest reminders here.',
            { url: '/' }
        );

        if (result && result.error) {
            return res.status(500).json({ error: result.error, details: "Firebase initialization failed" });
        }

        res.json({ success: true, tokenCount: user.fcmTokens.length, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear FCM Tokens (Fix duplicates)
router.post('/clear-fcm', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "No userId provided" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.fcmTokens = [];
        await user.save();

        res.json({ success: true, message: "FCM tokens cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send custom notification to a specific user (push + telegram)
router.post('/send-notification', async (req, res) => {
    const { userId, title, message, channel } = req.body;
    if (!userId || !title || !message) {
        return res.status(400).json({ error: "Missing userId, title, or message" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const results = { fcm: false, telegram: false };

        // Send FCM if requested and available (native app)
        if ((channel === 'all' || channel === 'push') && user.fcmTokens?.length > 0) {
            await sendFCMToUser(user, title, message, { url: '/' });
            results.fcm = true;
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

// Broadcast Message (GLOBAL)
router.post('/broadcast', async (req, res) => {
    const { title, message, target } = req.body; // target: 'all', 'fcm', 'telegram'

    if (!title || !message) return res.status(400).json({ error: "Title and message are required" });

    try {
        let query = {};
        if (target === 'fcm') query = { "fcmTokens.0": { $exists: true } };
        else if (target === 'telegram') query = { telegramChatId: { $ne: null } };

        // Ensure at least one contact method exists if targeting 'all'
        if (target === 'all') {
            query = { $or: [{ "fcmTokens.0": { $exists: true } }, { telegramChatId: { $ne: null } }] };
        }

        const users = await User.find(query);
        const results = { sent: 0, failed: 0 };

        await Promise.allSettled(users.map(async (user) => {
            try {
                // FCM
                if (user.fcmTokens?.length > 0 && (target === 'all' || target === 'fcm')) {
                    await sendFCMToUser(user, title, message, { url: '/' });
                }
                // Telegram
                if (user.telegramChatId && (target === 'all' || target === 'telegram')) {
                    await sendTelegramMessage(user.telegramChatId, `📢 *${title}*\n━━━━━━━━━━━━━━━━━━━━\n\n${message}`);
                }
                results.sent++;
            } catch (e) {
                console.error(`Broadcast failed for ${user.email}:`, e.message);
                results.failed++;
            }
        }));

        res.json({ success: true, stats: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
