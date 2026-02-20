const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');

const NodeCache = require('node-cache');
const contestCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

/**
 * GET /api/contests
 * Query params:
 *   platform  - filter by platform name
 *   date      - filter by date (YYYY-MM-DD), returns contests that START on that day
 *              - special value: "today" returns today's contests (all times of day)
 */
router.get('/', async (req, res) => {
    try {
        const { platform, date } = req.query;
        const cacheKey = [
            'contests',
            platform || 'all',
            date || 'upcoming'
        ].join('_');

        // Check cache first
        const cachedData = contestCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        let query = {};

        // --- Date filtering ---
        if (date) {
            // Resolve the target date (supports "today" or ISO date strings like "2026-02-20")
            const targetDate = date === 'today' ? new Date() : new Date(date);

            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD or "today".' });
            }

            // Start of day (00:00:00.000) in UTC
            const startOfDay = new Date(targetDate);
            startOfDay.setUTCHours(0, 0, 0, 0);

            // End of day (23:59:59.999) in UTC
            const endOfDay = new Date(targetDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            query.startTime = { $gte: startOfDay, $lte: endOfDay };
        } else {
            // Default: only upcoming contests
            query.startTime = { $gte: new Date() };
        }

        // --- Platform filtering ---
        if (platform) {
            query.platform = platform;
        }

        const contests = await Contest.find(query).sort({ startTime: 1 });

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

        const cachedData = contestCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const platforms = await Contest.distinct('platform');

        contestCache.set(cacheKey, platforms);
        res.json(platforms);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
