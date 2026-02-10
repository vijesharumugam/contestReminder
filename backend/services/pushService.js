const webpush = require('web-push');
const User = require('../models/User');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'vijesharumugam26@gmail.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${ADMIN_EMAIL}`,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
    console.log('[WebPush] VAPID keys configured');
} else {
    console.warn('[WebPush] Warning: VAPID keys not set, push notifications will not work');
}

/**
 * Send a push notification to a specific subscription
 * Returns true if successful, false if subscription is invalid (should be removed)
 */
const sendPushToSubscription = async (subscription, payload) => {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return true;
    } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid — mark for removal
            console.log(`[WebPush] Subscription expired: ${subscription.endpoint.slice(-20)}`);
            return false;
        }
        console.error(`[WebPush] Send failed:`, error.message);
        return false;
    }
};

/**
 * Send push notification to all subscriptions of a user
 * Automatically cleans up expired/invalid subscriptions
 */
const sendPushToUser = async (user, payload) => {
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

    const results = await Promise.allSettled(
        user.pushSubscriptions.map(async (sub) => {
            const success = await sendPushToSubscription(sub, payload);
            return { sub, success };
        })
    );

    // Collect expired subscriptions to remove
    const expiredEndpoints = results
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => r.value.sub.endpoint);

    // Clean up expired subscriptions from DB
    if (expiredEndpoints.length > 0) {
        try {
            await User.updateOne(
                { _id: user._id },
                { $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } } }
            );
            console.log(`[WebPush] Cleaned ${expiredEndpoints.length} expired subscription(s) for ${user.email}`);
        } catch (err) {
            console.error(`[WebPush] Cleanup failed for ${user.email}:`, err.message);
        }
    }
};

/**
 * Send push notification to all users with push enabled
 */
const sendPushToAllUsers = async (payload) => {
    const users = await User.find({
        'preferences.push': true,
        'pushSubscriptions.0': { $exists: true }
    }).lean();

    if (!users.length) {
        console.log('[WebPush] No users with push enabled');
        return;
    }

    console.log(`[WebPush] Sending to ${users.length} user(s)`);

    await Promise.allSettled(
        users.map(user => sendPushToUser(user, payload))
    );
};

module.exports = {
    sendPushToSubscription,
    sendPushToUser,
    sendPushToAllUsers
};
