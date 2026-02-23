const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, generateTelegramConnectToken } = require('../middleware/auth');

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

// ===== WEB PUSH ROUTES (Deprecated) =====
router.post('/push/subscribe', authenticate, (req, res) => {
    res.status(410).json({ error: "Web push is deprecated. Use native app notifications." });
});

router.post('/push/unsubscribe', authenticate, (req, res) => {
    res.status(410).json({ error: "Web push is deprecated. Use native app notifications." });
});

router.get('/push/vapid-key', (req, res) => {
    res.status(410).json({ error: "Web push is deprecated. Use native app notifications." });
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

// Generate short-lived secure token for Telegram connect deep link
router.get('/telegram/connect-token', authenticate, async (req, res) => {
    try {
        const token = generateTelegramConnectToken(req.user._id.toString());
        res.json({ token });
    } catch (error) {
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
