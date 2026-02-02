// Refactored for Vercel Serverless - no node-cron needed
// These functions will be called by HTTP endpoints triggered by Vercel Cron

const Contest = require('../models/Contest');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');
const { fetchAndSaveContests } = require('./clistService');
const { sendEmail } = require('./mailer');
const { sendTelegramMessage } = require('./telegramService');

const sendDailyDigest = async () => {
    const users = await User.find({ 'preferences.email': true });
    if (!users.length) return;

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingContests = await Contest.find({
        startTime: { $gte: now, $lt: next24h }
    }).sort({ startTime: 1 });

    if (!upcomingContests.length) return;

    for (const user of users) {
        // Basic HTML Table
        const listHtml = upcomingContests.map(c =>
            `<li><b>${c.name}</b> (${c.platform}) - ${new Date(c.startTime).toUTCString()} <a href="${c.url}">Link</a></li>`
        ).join('');

        const html = `<h3>Upcoming Contests Today</h3><ul>${listHtml}</ul>`;

        await sendEmail(user.email, "Daily Contest Digest", html);
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

    const users = await User.find({});

    for (const contest of contests) {
        for (const user of users) {
            // Check preferences
            const wantsEmail = user.preferences.email;
            const wantsTelegram = user.preferences.telegram && user.telegramChatId;

            if (!wantsEmail && !wantsTelegram) continue;

            const alreadySent = await NotificationLog.findOne({
                userId: user._id,
                contestId: contest._id,
                type: '30m'
            });

            if (alreadySent) continue;

            // Send Notifications
            const message = `Reminder: ${contest.name} on ${contest.platform} starts in 30 minutes! ${contest.url}`;

            if (wantsTelegram) {
                await sendTelegramMessage(user.telegramChatId, message);
            }

            if (wantsEmail) {
                await sendEmail(user.email, `Reminder: ${contest.name}`, `<p>${message}</p>`);
            }

            // Log it
            await NotificationLog.create({
                userId: user._id,
                contestId: contest._id,
                type: '30m'
            });
        }
    }
};

module.exports = {
    fetchAndSaveContests,
    sendDailyDigest,
    sendUpcomingReminders
};
