const Contest = require('../models/Contest');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');
const { sendTelegramMessage } = require('./telegramService');

/**
 * Format date/time for Telegram messages
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
 * Send daily digest of upcoming contests via Telegram
 */
const sendDailyDigest = async () => {
    try {
        // Only send to users with Telegram enabled
        const users = await User.find({
            'preferences.telegram': true,
            telegramChatId: { $exists: true, $ne: null }
        }).lean(); // Use lean() for better performance

        if (!users.length) {
            console.log('[Scheduler] No users with Telegram enabled for daily digest');
            return;
        }

        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingContests = await Contest.find({
            startTime: { $gte: now, $lt: next24h }
        }).sort({ startTime: 1 }).lean();

        console.log(`[Scheduler] Sending daily digest to ${users.length} users via Telegram (${upcomingContests.length} contests found)`);

        // Send to all users in parallel for better performance
        await Promise.allSettled(
            users.map(async (user) => {
                try {
                    let message;

                    if (upcomingContests.length > 0) {
                        // Format contests professionally
                        const contestList = upcomingContests.map((contest, index) => {
                            const timeStr = formatDateTime(contest.startTime);
                            return `${index + 1}. *${contest.name}*\n   📍 Platform: ${contest.platform}\n   ⏰ ${timeStr}\n   🔗 [Join Contest](${contest.url})`;
                        }).join('\n\n');

                        message = `🌟 *Daily Contest Digest*\n━━━━━━━━━━━━━━━━━━━━\n\n📅 *${upcomingContests.length} Contest${upcomingContests.length > 1 ? 's' : ''} in the Next 24 Hours*\n\n${contestList}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 Good luck and happy coding!`;
                    } else {
                        message = `☀️ *Good Morning! Daily Contest Update*\n━━━━━━━━━━━━━━━━━━━━\n\n📭 *No contests scheduled for today.*\n\nTake this time to practice, review past problems, or relax — you've earned it! 💪\n\nWe'll notify you as soon as new contests are available.\n\n━━━━━━━━━━━━━━━━━━━━\n🔔 Stay tuned for tomorrow's digest!`;
                    }

                    await sendTelegramMessage(user.telegramChatId, message);
                    console.log(`[Scheduler] ✅ Daily digest sent to ${user.email}`);
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
 * Send 30-minute reminders for upcoming contests via Telegram
 */
const sendUpcomingReminders = async () => {
    try {
        const now = new Date();
        const rangeStart = new Date(now.getTime() + 25 * 60 * 1000); // +25 mins
        const rangeEnd = new Date(now.getTime() + 35 * 60 * 1000);   // +35 mins

        // Find contests starting in roughly 30 mins
        const contests = await Contest.find({
            startTime: { $gte: rangeStart, $lte: rangeEnd }
        }).lean();

        if (!contests.length) return;

        // Only get users with Telegram enabled
        const users = await User.find({
            'preferences.telegram': true,
            telegramChatId: { $exists: true, $ne: null }
        }).lean();

        if (!users.length) {
            console.log('[Scheduler] No users with Telegram enabled for reminders');
            return;
        }

        console.log(`[Scheduler] Checking 30-min reminders for ${contests.length} contest(s)`);

        // Process all contest-user combinations in parallel
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

                        // Send professional Telegram notification
                        const timeStr = formatDateTime(contest.startTime);
                        const message = `⏰ *Contest Starting Soon!*\n━━━━━━━━━━━━━━━━━━━━\n\n🎯 *${contest.name}*\n📍 Platform: *${contest.platform}*\n⏰ Starts in: *30 minutes*\n🕐 Start Time: ${timeStr}\n\n🔗 [Join Now](${contest.url})\n\n━━━━━━━━━━━━━━━━━━━━\n💪 Get ready to compete!`;

                        await sendTelegramMessage(user.telegramChatId, message);
                        console.log(`[Scheduler] ✅ 30-min reminder sent to ${user.email} for ${contest.name}`);

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
