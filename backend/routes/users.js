const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get authenticated user's full status
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Preferences
router.put('/preferences', authenticate, async (req, res) => {
    const { preferences } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { preferences },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== PUSH SUBSCRIPTION ROUTES =====

// Subscribe to push notifications
router.post('/push/subscribe', authenticate, async (req, res) => {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: "Missing subscription" });

    try {
        const user = await User.findById(req.user._id);
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

        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, user: userObj });
    } catch (error) {
        console.error('[Push] Subscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from push notifications
router.post('/push/unsubscribe', authenticate, async (req, res) => {
    const { endpoint } = req.body;

    try {
        const user = await User.findById(req.user._id);
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

        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, user: userObj });
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get VAPID public key (public route - no auth needed)
router.get('/push/vapid-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ error: "VAPID key not configured" });
    res.json({ publicKey: key });
});

// ===== TELEGRAM ROUTES =====

// Disconnect Telegram
router.post('/disconnect-telegram', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.telegramChatId = undefined;
        user.preferences.telegram = false;
        await user.save();

        console.log(`[Users] Telegram disconnected for user ${user.email}`);

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (error) {
        console.error('[Users] Disconnect Telegram error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manual Connect Telegram (for testing/debugging)
router.post('/connect-telegram', authenticate, async (req, res) => {
    const { telegramChatId } = req.body;
    if (!telegramChatId) return res.status(400).json({ error: "Missing telegramChatId" });

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.telegramChatId = String(telegramChatId);
        user.preferences.telegram = true;
        await user.save();

        console.log(`[Users] Telegram manually connected for user ${user.email}, chatId: ${telegramChatId}`);

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (error) {
        console.error('[Users] Connect Telegram error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FCM TOKEN ROUTES (Native App) =====

// Register FCM token from native app
router.post('/fcm-token', authenticate, async (req, res) => {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: "Missing fcmToken" });

    try {
        const user = await User.findById(req.user._id);
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
