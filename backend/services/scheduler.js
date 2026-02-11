const Contest = require('../models/Contest');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');
const { sendTelegramMessage } = require('./telegramService');
const { sendPushToUser } = require('./pushService');

/**
 * Format date/time for messages
 */
const formatDateTime = (date) => {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    };
    return new Date(date).toLocaleString('en-US', options);
};

/**
 * Send daily digest of upcoming contests
 * Push = Primary, Telegram = Secondary
 */
const sendDailyDigest = async () => {
    try {
        // Get all users with at least one notification method enabled
        const users = await User.find({
            $or: [
                { 'preferences.push': true, 'pushSubscriptions.0': { $exists: true } },
                { 'preferences.telegram': true, telegramChatId: { $exists: true, $ne: null } }
            ]
        }).lean();

        if (!users.length) {
            console.log('[Scheduler] No users with notifications enabled for daily digest');
            return;
        }

        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingContests = await Contest.find({
            startTime: { $gte: now, $lt: next24h }
        }).sort({ startTime: 1 }).lean();

        console.log(`[Scheduler] Sending daily digest to ${users.length} users (${upcomingContests.length} contests found)`);

        await Promise.allSettled(
            users.map(async (user) => {
                try {
                    // ===== PRIMARY: Web Push =====
                    if (user.preferences?.push && user.pushSubscriptions?.length > 0) {
                        let pushPayload;

                        if (upcomingContests.length > 0) {
                            const contestNames = upcomingContests.slice(0, 3).map(c => c.name).join(', ');
                            const more = upcomingContests.length > 3 ? ` +${upcomingContests.length - 3} more` : '';
                            pushPayload = {
                                type: 'daily_digest',
                                title: `📅 ${upcomingContests.length} Contest${upcomingContests.length > 1 ? 's' : ''} Today`,
                                body: `${contestNames}${more}`,
                                icon: '/icons/icon-192x192.png',
                                badge: '/icons/icon-192x192.png',
                                data: {
                                    url: '/',
                                    contests: upcomingContests.map(c => ({
                                        name: c.name,
                                        platform: c.platform,
                                        startTime: c.startTime,
                                        url: c.url
                                    }))
                                }
                            };
                        } else {
                            pushPayload = {
                                type: 'daily_digest',
                                title: '☀️ Good Morning!',
                                body: 'No contests scheduled for today. Take a break or practice!',
                                icon: '/icons/icon-192x192.png',
                                badge: '/icons/icon-192x192.png',
                                data: { url: '/' }
                            };
                        }

                        await sendPushToUser(user, pushPayload);
                        console.log(`[Scheduler] ✅ Push digest sent to ${user.email}`);
                    }

                    // ===== SECONDARY: Telegram =====
                    if (user.preferences?.telegram && user.telegramChatId) {
                        let message;

                        if (upcomingContests.length > 0) {
                            const contestList = upcomingContests.map((contest, index) => {
                                const timeStr = formatDateTime(contest.startTime);
                                return `${index + 1}. *${contest.name}*\n   📍 Platform: ${contest.platform}\n   ⏰ ${timeStr}\n   🔗 [Join Contest](${contest.url})`;
                            }).join('\n\n');

                            message = `🌟 *Daily Contest Digest*\n━━━━━━━━━━━━━━━━━━━━\n\n📅 *${upcomingContests.length} Contest${upcomingContests.length > 1 ? 's' : ''} in the Next 24 Hours*\n\n${contestList}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 Good luck and happy coding!`;
                        } else {
                            message = `☀️ *Good Morning! Daily Contest Update*\n━━━━━━━━━━━━━━━━━━━━\n\n📭 *No contests scheduled for today.*\n\nTake this time to practice, review past problems, or relax — you've earned it! 💪\n\nWe'll notify you as soon as new contests are available.\n\n━━━━━━━━━━━━━━━━━━━━\n🔔 Stay tuned for tomorrow's digest!`;
                        }

                        await sendTelegramMessage(user.telegramChatId, message);
                        console.log(`[Scheduler] ✅ Telegram digest sent to ${user.email}`);
                    }
                } catch (error) {
                    console.error(`[Scheduler] ❌ Failed to send daily digest to ${user.email}:`, error.message);
                }
            })
        );
    } catch (error) {
        console.error('[Scheduler] ❌ Error in sendDailyDigest:', error.message);
    }
};

/**
 * Send 30-minute reminders for upcoming contests
 * Push = Primary, Telegram = Secondary
 */
const sendUpcomingReminders = async () => {
    try {
        const now = new Date();
        const rangeStart = new Date(now.getTime() + 25 * 60 * 1000);
        const rangeEnd = new Date(now.getTime() + 35 * 60 * 1000);

        const contests = await Contest.find({
            startTime: { $gte: rangeStart, $lte: rangeEnd }
        }).lean();

        if (!contests.length) return;

        const users = await User.find({
            $or: [
                { 'preferences.push': true, 'pushSubscriptions.0': { $exists: true } },
                { 'preferences.telegram': true, telegramChatId: { $exists: true, $ne: null } }
            ]
        }).lean();

        if (!users.length) {
            console.log('[Scheduler] No users with notifications enabled for reminders');
            return;
        }

        console.log(`[Scheduler] Checking 30-min reminders for ${contests.length} contest(s)`);

        await Promise.allSettled(
            contests.flatMap(contest =>
                users.map(async (user) => {
                    try {
                        // Check if already sent
                        const alreadySent = await NotificationLog.findOne({
                            userId: user._id,
                            contestId: contest._id,
                            type: '30m'
                        }).lean();

                        if (alreadySent) return;

                        const timeStr = formatDateTime(contest.startTime);

                        // ===== PRIMARY: Web Push =====
                        if (user.preferences?.push && user.pushSubscriptions?.length > 0) {
                            const pushPayload = {
                                type: 'reminder',
                                title: `⏰ ${contest.name} starts in 30 min!`,
                                body: `${contest.platform} • ${timeStr}`,
                                icon: '/icons/icon-192x192.png',
                                badge: '/icons/icon-192x192.png',
                                data: {
                                    url: contest.url,
                                    contestName: contest.name,
                                    platform: contest.platform
                                }
                            };

                            await sendPushToUser(user, pushPayload);
                            console.log(`[Scheduler] ✅ Push reminder sent to ${user.email} for ${contest.name}`);
                        }

                        // ===== SECONDARY: Telegram =====
                        if (user.preferences?.telegram && user.telegramChatId) {
                            const message = `⏰ *Contest Starting Soon!*\n━━━━━━━━━━━━━━━━━━━━\n\n🎯 *${contest.name}*\n📍 Platform: *${contest.platform}*\n⏰ Starts in: *30 minutes*\n🕐 Start Time: ${timeStr}\n\n🔗 [Join Now](${contest.url})\n\n━━━━━━━━━━━━━━━━━━━━\n💪 Get ready to compete!`;

                            await sendTelegramMessage(user.telegramChatId, message);
                            console.log(`[Scheduler] ✅ Telegram reminder sent to ${user.email} for ${contest.name}`);
                        }

                        // Log notification
                        await NotificationLog.create({
                            userId: user._id,
                            contestId: contest._id,
                            type: '30m'
                        });
                    } catch (error) {
                        console.error(`[Scheduler] ❌ Failed to send reminder to ${user.email}:`, error.message);
                    }
                })
            )
        );
    } catch (error) {
        console.error('[Scheduler] ❌ Error in sendUpcomingReminders:', error.message);
    }
};

module.exports = {
    sendDailyDigest,
    sendUpcomingReminders
};
