
const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const Contest = require('../models/Contest');


const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

console.log(`[Telegram] Token: ${token ? 'configured' : 'NOT FOUND'}`);

if (token) {
    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram Bot Polling Started');

    // Handle /start <token> - when user clicks the connect link
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const connectToken = match[1]; // The captured token (should be clerkId)

        console.log(`[Telegram] Received /start command with token: ${connectToken}, chatId: ${chatId}`);

        if (!connectToken) {
            console.log('[Telegram] No connect token provided');
            return;
        }

        try {
            // Find user by clerkId
            let user = await User.findOne({ clerkId: connectToken });
            console.log(`[Telegram] User lookup result:`, user ? `Found: ${user.email}` : 'Not found');

            if (user) {
                // Update user with Telegram chat ID
                user.telegramChatId = String(chatId);
                user.preferences.telegram = true;

                // Save and wait for confirmation
                const savedUser = await user.save();
                console.log(`[Telegram] Save result - telegramChatId: ${savedUser.telegramChatId}, telegram pref: ${savedUser.preferences.telegram}`);

                // Verify the save was successful
                if (savedUser.telegramChatId === String(chatId)) {
                    await bot.sendMessage(chatId, "✅ Success! Your Telegram account has been linked to your Contest Reminder account.\n\nYou will now receive contest reminders here!");
                    console.log(`[Telegram] Successfully linked for user ${user.email}, chatId: ${chatId}`);

                    // ---------------------------------------------------------
                    // NEW: Send 3-Day Contest Summary immediately
                    // ---------------------------------------------------------
                    try {
                        const now = new Date();
                        const next3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

                        const contests = await Contest.find({
                            startTime: { $gte: now, $lt: next3Days }
                        }).sort({ startTime: 1 }).lean();

                        if (contests.length > 0) {
                            // Helper for formatting
                            const formatDateTime = (date) => {
                                const options = {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Kolkata',
                                    timeZoneName: 'short'
                                };
                                return new Date(date).toLocaleString('en-US', options);
                            };

                            const contestList = contests.map((c, i) =>
                                `${i + 1}. *${c.name}*\n   📍 ${c.platform}\n   ⏰ ${formatDateTime(c.startTime)}\n   🔗 [Link](${c.url})`
                            ).join('\n\n');

                            const summaryMsg = `🌟 *Welcome! Here are the contests coming up in the next 3 days:*\n━━━━━━━━━━━━━━━━━━━━\n\n${contestList}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 You'll get daily digests at 8:00 AM!`;

                            await bot.sendMessage(chatId, summaryMsg, { parse_mode: 'Markdown' });
                            console.log(`[Telegram] Sent welcome summary to ${user.email}`);
                        } else {
                            await bot.sendMessage(chatId, "📅 No contests found for the next 3 days. We'll verify daily and notify you when one appears!");
                        }
                    } catch (summaryError) {
                        console.error(`[Telegram] Failed to send welcome summary:`, summaryError.message);
                    }
                    // ---------------------------------------------------------

                } else {
                    bot.sendMessage(chatId, "⚠️ There was an issue saving your connection. Please try again.");
                    console.error(`[Telegram] Save verification failed for ${user.email}`);
                }
            } else {
                bot.sendMessage(chatId, "❌ Could not identify user. Please try initiating the connection from the website again.\n\nMake sure you're logged in on the website first.");
                console.log(`[Telegram] User not found for clerkId: ${connectToken}`);
            }
        } catch (err) {
            console.error("[Telegram] Bot Error:", err);
            bot.sendMessage(chatId, "❌ An error occurred while linking. Please try again later.");
        }
    });

    // Handle plain /start (without token)
    bot.onText(/^\/start$/, (msg) => {
        bot.sendMessage(msg.chat.id, "👋 Hello! Please use the 'Connect Telegram' button on the website to link your account.\n\n🔗 Visit the Settings page on the Contest Reminder website to get started.");
    });
} else {
    console.log('[Telegram] Warning: TELEGRAM_BOT_TOKEN not set, bot not initialized');
}

const sendTelegramMessage = async (chatId, text) => {
    if (!bot || !chatId) return;
    try {
        await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(`Telegram Send Error to ${chatId}:`, error.message);
    }
};

module.exports = { sendTelegramMessage, bot };
