const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Sync User from Clerk (Call on login/signup)
router.post('/sync', async (req, res) => {
    const { clerkId, email } = req.body;
    if (!clerkId || !email) return res.status(400).send("Missing fields");

    try {
        let user = await User.findOne({ clerkId });
        if (!user) {
            user = new User({ clerkId, email });
            await user.save();
        }
        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Update Preferences
router.put('/preferences', async (req, res) => {
    const { clerkId, preferences } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { clerkId },
            { preferences },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get User Status
router.get('/:clerkId', async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.params.clerkId });
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ===== PUSH SUBSCRIPTION ROUTES =====

// Subscribe to push notifications
router.post('/push/subscribe', async (req, res) => {
    const { clerkId, subscription } = req.body;
    if (!clerkId || !subscription) return res.status(400).json({ error: "Missing clerkId or subscription" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if this subscription endpoint already exists
        const exists = user.pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push({
                endpoint: subscription.endpoint,
                keys: subscription.keys
            });
        }

        user.preferences.push = true;
        await user.save();

        console.log(`[Push] Subscription added for ${user.email} (${user.pushSubscriptions.length} total)`);
        res.json({ success: true, user });
    } catch (error) {
        console.error('[Push] Subscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from push notifications
router.post('/push/unsubscribe', async (req, res) => {
    const { clerkId, endpoint } = req.body;
    if (!clerkId) return res.status(400).json({ error: "Missing clerkId" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (endpoint) {
            // Remove specific subscription
            user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
        } else {
            // Remove all subscriptions
            user.pushSubscriptions = [];
        }

        // If no subscriptions left, disable push preference
        if (user.pushSubscriptions.length === 0) {
            user.preferences.push = false;
        }

        await user.save();

        console.log(`[Push] Unsubscribed for ${user.email} (${user.pushSubscriptions.length} remaining)`);
        res.json({ success: true, user });
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get VAPID public key
router.get('/push/vapid-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ error: "VAPID key not configured" });
    res.json({ publicKey: key });
});

// ===== TELEGRAM ROUTES =====

// Disconnect Telegram
router.post('/disconnect-telegram', async (req, res) => {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ error: "Missing clerkId" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.telegramChatId = undefined;
        user.preferences.telegram = false;
        await user.save();

        console.log(`[Users] Telegram disconnected for user ${user.email}`);
        res.json(user);
    } catch (error) {
        console.error('[Users] Disconnect Telegram error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manual Connect Telegram (for testing/debugging)
router.post('/connect-telegram', async (req, res) => {
    const { clerkId, telegramChatId } = req.body;
    if (!clerkId || !telegramChatId) return res.status(400).json({ error: "Missing clerkId or telegramChatId" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.telegramChatId = String(telegramChatId);
        user.preferences.telegram = true;
        await user.save();

        console.log(`[Users] Telegram manually connected for user ${user.email}, chatId: ${telegramChatId}`);
        res.json(user);
    } catch (error) {
        console.error('[Users] Connect Telegram error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FCM TOKEN ROUTES (Native App) =====

// Register FCM token from native app
router.post('/fcm-token', async (req, res) => {
    const { clerkId, fcmToken } = req.body;
    if (!clerkId || !fcmToken) return res.status(400).json({ error: "Missing clerkId or fcmToken" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Add token if not already present
        if (!user.fcmTokens.includes(fcmToken)) {
            user.fcmTokens.push(fcmToken);
        }

        // Auto-enable push preference
        user.preferences.push = true;
        await user.save();

        console.log(`[FCM] Token registered for ${user.email} (${user.fcmTokens.length} total)`);
        res.json({ success: true });
    } catch (error) {
        console.error('[FCM] Token registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
