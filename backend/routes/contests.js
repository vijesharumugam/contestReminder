const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');

// Get upcoming contests
router.get('/', async (req, res) => {
    try {
        const { platform } = req.query;
        let query = { startTime: { $gte: new Date() } };

        if (platform) {
            query.platform = platform;
        }

        const contests = await Contest.find(query).sort({ startTime: 1 });
        res.json(contests);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get unique platforms
router.get('/platforms', async (req, res) => {
    try {
        const platforms = await Contest.distinct('platform');
        res.json(platforms);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
