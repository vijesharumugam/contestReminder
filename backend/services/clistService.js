const axios = require('axios');
const Contest = require('../models/Contest');

const CLIST_USERNAME = process.env.CLIST_USERNAME;
const CLIST_API_KEY = process.env.CLIST_API_KEY;
const BASE_URL = "https://clist.by/api/v2/";
const DEFAULT_FETCH_LIMIT = 200;
const DEFAULT_MAX_FETCH_BATCHES = 30;
const FETCH_BATCH_SIZE = Math.max(parseInt(process.env.CONTEST_FETCH_LIMIT || `${DEFAULT_FETCH_LIMIT}`, 10) || DEFAULT_FETCH_LIMIT, 1);
const MAX_FETCH_BATCHES = Math.max(
    parseInt(process.env.CONTEST_FETCH_MAX_BATCHES || `${DEFAULT_MAX_FETCH_BATCHES}`, 10) || DEFAULT_MAX_FETCH_BATCHES,
    1
);

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
        return {
            fetched: 0,
            inserted: 0,
            updated: 0,
            pruned: 0,
            batchSize: FETCH_BATCH_SIZE,
            batches: 0
        };
    }

    const now = new Date().toISOString();

    try {
        const seenContestIds = new Set();
        const contests = [];
        let usedBatches = 0;

        for (let batchIndex = 0; batchIndex < MAX_FETCH_BATCHES; batchIndex++) {
            const response = await axios.get(`${BASE_URL}contest/`, {
                headers: getHeaders(),
                params: {
                    resource_id__in: resourceIds.join(','),
                    start__gt: now,
                    order_by: 'start',
                    offset: batchIndex * FETCH_BATCH_SIZE,
                    limit: FETCH_BATCH_SIZE
                }
            });

            const batchContests = response.data.objects || [];
            if (!batchContests.length) break;
            usedBatches++;

            for (const contest of batchContests) {
                if (!seenContestIds.has(contest.id)) {
                    seenContestIds.add(contest.id);
                    contests.push(contest);
                }
            }

            if (batchContests.length < FETCH_BATCH_SIZE) break;

            if (batchIndex === MAX_FETCH_BATCHES - 1) {
                console.warn(
                    `[CLIST] Reached batch cap (${MAX_FETCH_BATCHES} x ${FETCH_BATCH_SIZE}). ` +
                    `Future contests may be truncated. Increase CONTEST_FETCH_MAX_BATCHES to fetch more.`
                );
            }
        }

        let insertedCount = 0;
        let updatedCount = 0;

        for (const c of contests) {
            const resourceName = extractResourceName(c.resource) || c.host || 'Unknown';
            let platform = normalizePlatform(resourceName);

            // Fallback: Detect platform from contest URL if resource name failed
            if (!resourceName || resourceName === 'Unknown' || platform === 'Unknown') {
                if (c.href && c.href.includes('codeforces.com')) {
                    platform = 'Codeforces';
                } else if (c.href && c.href.includes('leetcode.com')) {
                    platform = 'LeetCode';
                } else if (c.href && c.href.includes('codechef.com')) {
                    platform = 'CodeChef';
                }
            }

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
                insertedCount++;
            } else {
                // Optional: Update if details changed
                await Contest.updateOne({ externalId: c.id }, contestData);
                updatedCount++;
            }
        }

        console.log(`[CLIST] Synced ${contests.length} contests. Inserted: ${insertedCount}, Updated: ${updatedCount}, Batch size: ${FETCH_BATCH_SIZE}, Max batches: ${MAX_FETCH_BATCHES}`);

        return {
            fetched: contests.length,
            inserted: insertedCount,
            updated: updatedCount,
            pruned: 0,
            batchSize: FETCH_BATCH_SIZE,
            batches: usedBatches
        };

    } catch (error) {
        console.error("Error fetching contests:", error.message);
        throw error;
    }
};

module.exports = {
    fetchAndSaveContests,
    UPCOMING_CONTEST_LIMIT: FETCH_BATCH_SIZE
};
