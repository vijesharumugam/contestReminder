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
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
        return { success: 0, failure: 0, removed: 0, message: 'No tokens found for user' };
    }

    if (admin.apps.length === 0) {
        console.error('[FCM] Send failed: Firebase Admin SDK not initialized');
        return { success: 0, failure: 0, removed: 0, error: 'Firebase Admin SDK not initialized' };
    }

    const invalidTokens = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of user.fcmTokens) {
        try {
            const response = await admin.messaging().send({
                token,
                notification: {
                    title,
                    body,
                },
                data: {
                    ...data,
                    ...(data.url ? { url: String(data.url) } : {}),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // Legacy but sometimes helps
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
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
            });
            console.log(`[FCM] ✅ Success: Message sent to ${user.email}. ID: ${response}`);
            successCount++;
        } catch (error) {
            console.error(`[FCM] ❌ Failed to send to ${user.email}:`, error.code, error.message);
            if (error.stack) console.error(error.stack);
            failureCount++;

            if (
                error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token' ||
                error.message.includes('Requested entity was not found')
            ) {
                invalidTokens.push(token);
            }
        }
    }

    // Remove invalid tokens from DB (works with both Mongoose docs and lean objects)
    if (invalidTokens.length > 0) {
        try {
            await User.updateOne(
                { _id: user._id },
                { $pull: { fcmTokens: { $in: invalidTokens } } }
            );
            console.log(`[FCM] Removed ${invalidTokens.length} invalid token(s) for ${user.email}`);
        } catch (cleanupErr) {
            console.error(`[FCM] Failed to clean up tokens for ${user.email}:`, cleanupErr.message);
        }
    }

    return { success: successCount, failure: failureCount, removed: invalidTokens.length };
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
