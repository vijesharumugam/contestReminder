const Contest = require('../models/Contest');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');
const { sendTelegramMessage } = require('./telegramService');

const sendDailyDigest = async () => {
    // Only send to users with Telegram enabled
    const users = await User.find({
        'preferences.telegram': true,
        telegramChatId: { $exists: true, $ne: null }
    });

    if (!users.length) {
        console.log('[Scheduler] No users with Telegram enabled for daily digest');
        return;
    }

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingContests = await Contest.find({
        startTime: { $gte: now, $lt: next24h }
    }).sort({ startTime: 1 });

    if (!upcomingContests.length) {
        console.log('[Scheduler] No upcoming contests for daily digest');
        return;
    }

    console.log(`[Scheduler] Sending daily digest to ${users.length} users via Telegram`);

    for (const user of users) {
        try {
            // Format contests for Telegram
            const contestList = upcomingContests.map((c, index) =>
                `${index + 1}. *${c.name}* (${c.platform})\n   📅 ${new Date(c.startTime).toUTCString()}\n   🔗 ${c.url}`
            ).join('\n\n');

            const message = `🔔 *Upcoming Contests Today*\n\n${contestList}`;

            await sendTelegramMessage(user.telegramChatId, message);
            console.log(`[Scheduler] Daily digest sent to ${user.email} via Telegram`);
        } catch (error) {
            console.error(`[Scheduler] Failed to send daily digest to ${user.email}:`, error.message);
        }
    }
};

const sendUpcomingReminders = async () => {
    const now = new Date();
    const rangeStart = new Date(now.getTime() + 25 * 60 * 1000); // +25 mins
    const rangeEnd = new Date(now.getTime() + 35 * 60 * 1000);   // +35 mins

    // Find contests starting in roughly 30 mins
    const contests = await Contest.find({
        startTime: { $gte: rangeStart, $lte: rangeEnd }
    });

    if (!contests.length) return;

    // Only get users with Telegram enabled
    const users = await User.find({
        'preferences.telegram': true,
        telegramChatId: { $exists: true, $ne: null }
    });

    if (!users.length) {
        console.log('[Scheduler] No users with Telegram enabled for reminders');
        return;
    }

    console.log(`[Scheduler] Checking 30-min reminders for ${contests.length} contests`);

    for (const contest of contests) {
        for (const user of users) {
            try {
                // Check if already sent
                const alreadySent = await NotificationLog.findOne({
                    userId: user._id,
                    contestId: contest._id,
                    type: '30m'
                });

                if (alreadySent) continue;

                // Send Telegram notification
                const message = `⏰ *Reminder*\n\n${contest.name} on *${contest.platform}* starts in 30 minutes!\n\n🔗 ${contest.url}`;

                await sendTelegramMessage(user.telegramChatId, message);
                console.log(`[Scheduler] 30-min reminder sent to ${user.email} for ${contest.name}`);

                // Log it
                await NotificationLog.create({
                    userId: user._id,
                    contestId: contest._id,
                    type: '30m'
                });
            } catch (error) {
                console.error(`[Scheduler] Failed to send reminder to ${user.email}:`, error.message);
            }
        }
    }
};

module.exports = {
    sendDailyDigest,
    sendUpcomingReminders
};
