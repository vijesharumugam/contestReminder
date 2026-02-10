const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');

const NodeCache = require('node-cache');
const contestCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Get upcoming contests
router.get('/', async (req, res) => {
    try {
        const { platform } = req.query;
        const cacheKey = platform ? `contests_${platform}` : 'contests_all';

        // Check cache first
        const cachedData = contestCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        let query = { startTime: { $gte: new Date() } };

        if (platform) {
            query.platform = platform;
        }

        const contests = await Contest.find(query).sort({ startTime: 1 });

        // Store in cache
        contestCache.set(cacheKey, contests);

        res.json(contests);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get unique platforms
router.get('/platforms', async (req, res) => {
    try {
        const cacheKey = 'platforms_list';

        // Check cache first
        const cachedData = contestCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const platforms = await Contest.distinct('platform');

        // Store in cache
        contestCache.set(cacheKey, platforms);

        res.json(platforms);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
