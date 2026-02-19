const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK
// Uses environment variables for credentials (set FIREBASE_SERVICE_ACCOUNT as JSON string)
const initializeFirebase = () => {
    if (admin.apps.length > 0) return; // Already initialized

    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[FCM] Firebase Admin SDK initialized');
    } catch (error) {
        console.error('[FCM] Failed to initialize Firebase Admin SDK:', error.message);
        console.error('[FCM] Make sure FIREBASE_SERVICE_ACCOUNT env var is set as a JSON string');
    }
};

/**
 * Send a native push notification to a specific user via FCM
 */
const sendFCMToUser = async (user, title, body, data = {}) => {
    if (!user.fcmTokens || user.fcmTokens.length === 0) return;
    if (!admin.apps.length) return;

    const invalidTokens = [];

    for (const token of user.fcmTokens) {
        try {
            await admin.messaging().send({
                token,
                notification: {
                    title,
                    body,
                },
                data: {
                    ...data,
                    // Ensure all values are strings (FCM requirement)
                    ...(data.url ? { url: String(data.url) } : {}),
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'contest-reminders',
                        icon: '@mipmap/ic_launcher',
                        color: '#3b82f6',
                        sound: 'default',
                    },
                },
            });
            console.log(`[FCM] Notification sent to ${user.email} (token: ${token.substring(0, 20)}...)`);
        } catch (error) {
            console.error(`[FCM] Error sending to ${user.email}:`, error.message);
            // If the token is invalid/expired, mark for removal
            if (
                error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token'
            ) {
                invalidTokens.push(token);
            }
        }
    }

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
        user.fcmTokens = user.fcmTokens.filter(t => !invalidTokens.includes(t));
        await user.save();
        console.log(`[FCM] Removed ${invalidTokens.length} invalid token(s) for ${user.email}`);
    }
};

/**
 * Send a native push notification to ALL users with FCM tokens
 */
const sendFCMToAll = async (title, body, data = {}) => {
    if (!admin.apps.length) {
        console.log('[FCM] Firebase not initialized, skipping FCM notifications');
        return;
    }

    try {
        const users = await User.find({
            fcmTokens: { $exists: true, $ne: [] },
            'preferences.push': true,
        });

        console.log(`[FCM] Sending "${title}" to ${users.length} user(s) with FCM tokens`);

        for (const user of users) {
            await sendFCMToUser(user, title, body, data);
        }
    } catch (error) {
        console.error('[FCM] Error sending to all users:', error);
    }
};

module.exports = {
    initializeFirebase,
    sendFCMToUser,
    sendFCMToAll,
};
