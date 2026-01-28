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

module.exports = router;
