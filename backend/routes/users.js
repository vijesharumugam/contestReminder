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

// Get User Status (Telegram linked?)
router.get('/:clerkId', async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.params.clerkId });
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Disconnect Telegram
router.post('/disconnect-telegram', async (req, res) => {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ error: "Missing clerkId" });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Clear Telegram connection
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

        // Set Telegram connection
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

module.exports = router;
