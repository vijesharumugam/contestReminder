const axios = require('axios');
const Contest = require('../models/Contest');

const CLIST_USERNAME = process.env.CLIST_USERNAME;
const CLIST_API_KEY = process.env.CLIST_API_KEY;
const BASE_URL = "https://clist.by/api/v2/";

if (!CLIST_USERNAME || !CLIST_API_KEY) {
    console.warn('[CLIST] Warning: CLIST_USERNAME or CLIST_API_KEY not configured. Contest fetching will fail.');
}

const getHeaders = () => ({
    "Authorization": `ApiKey ${CLIST_USERNAME}:${CLIST_API_KEY}`
});

const extractResourceName = (resource) => {
    if (!resource) return '';
    if (typeof resource === 'string') return resource;
    if (typeof resource === 'object') {
        if (typeof resource.name === 'string') return resource.name;
        if (typeof resource.host === 'string') return resource.host;
    }
    return '';
};

const normalizePlatform = (resourceName) => {
    const raw = (resourceName || '').toLowerCase();
    if (!raw) return 'Unknown';

    if (raw.includes('codechef')) return 'CodeChef';
    if (raw.includes('codeforces')) return 'Codeforces';
    if (raw.includes('leetcode')) return 'LeetCode';

    const cleaned = raw
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .replace(/\.com$/, '');

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

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

        const missing = resourceNames.filter((n) => map[n] == null);
        for (const name of missing) {
            const needle = name.replace(/^www\./, '').replace(/\.com$/, '');
            try {
                const fallbackResp = await axios.get(`${BASE_URL}resource/`, {
                    headers: getHeaders(),
                    params: {
                        name__icontains: needle,
                        limit: 20
                    }
                });

                const objs = fallbackResp.data?.objects || [];
                const best = objs.find((r) => (r.name || '').toLowerCase() === name.toLowerCase())
                    || objs.find((r) => (r.name || '').toLowerCase().includes(name.toLowerCase()))
                    || objs.find((r) => (r.name || '').toLowerCase().includes(needle.toLowerCase()))
                    || objs[0];

                if (best?.id != null && best?.name) {
                    map[best.name] = best.id;
                } else {
                    console.warn(`CLIST resource not found for: ${name}`);
                }
            } catch (e) {
                console.warn(`CLIST fallback resource lookup failed for: ${name} (${e.message})`);
            }
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
            const resourceName = extractResourceName(c.resource) || c.host || 'Unknown';
            const platform = normalizePlatform(resourceName);

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
