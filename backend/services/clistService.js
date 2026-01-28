const axios = require('axios');
const Contest = require('../models/Contest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const CLIST_USERNAME = process.env.CLIST_USERNAME;
const CLIST_API_KEY = process.env.CLIST_API_KEY;
const BASE_URL = "https://clist.by/api/v2/";

const getHeaders = () => ({
    "Authorization": `ApiKey ${CLIST_USERNAME}:${CLIST_API_KEY}`
});

const getResourceIds = async (resourceNames) => {
    try {
        const response = await axios.get(`${BASE_URL}resource/`, {
            headers: getHeaders(),
            params: {
                name__in: resourceNames.join(','),
                limit: 10
            }
        });

        const map = {};
        if (response.data && response.data.objects) {
            response.data.objects.forEach(r => {
                map[r.name] = r.id;
            });
        }
        return map;
    } catch (error) {
        console.error("Error fetching resources:", error.message);
        return {};
    }
};

const fetchAndSaveContests = async () => {
    const targetResources = ['codechef.com', 'leetcode.com', 'codeforces.com'];
    const resourceIdsMap = await getResourceIds(targetResources);
    const resourceIds = Object.values(resourceIdsMap);

    if (resourceIds.length === 0) {
        console.log("No resource IDs found.");
        return;
    }

    const now = new Date().toISOString();

    try {
        const response = await axios.get(`${BASE_URL}contest/`, {
            headers: getHeaders(),
            params: {
                resource_id__in: resourceIds.join(','),
                start__gt: now,
                order_by: 'start',
                limit: 50 // Fetch enough logic
            }
        });

        const contests = response.data.objects || [];
        let newCount = 0;

        for (const c of contests) {
            const platformStr = (c.resource || c.host || 'Unknown').replace('.com', '');
            const platform = platformStr.charAt(0).toUpperCase() + platformStr.slice(1);

            const contestData = {
                externalId: c.id,
                name: c.event,
                platform: platform,
                startTime: c.start,
                duration: c.duration,
                url: c.href,
                resourceId: c.resource_id || 0
            };

            // Upsert
            const exists = await Contest.findOne({ externalId: c.id });
            if (!exists) {
                await Contest.create(contestData);
                newCount++;
            } else {
                // Optional: Update if details changed
                await Contest.updateOne({ externalId: c.id }, contestData);
            }
        }
        console.log(`Fetched ${contests.length} contests. Added ${newCount} new.`);

    } catch (error) {
        console.error("Error fetching contests:", error.message);
    }
};

module.exports = { fetchAndSaveContests };
