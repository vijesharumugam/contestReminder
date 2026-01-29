const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

console.log(`[Telegram] Token: ${token ? 'configured' : 'NOT FOUND'}`);

// Initialize Bot if token exists
if (token) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        // Webhook mode for Vercel
        bot = new TelegramBot(token, { polling: false });
        console.log('[Telegram] Initialized in Webhook mode');
    } else {
        // Polling mode for Local Development
        bot = new TelegramBot(token, { polling: true });
        console.log('[Telegram] Initialized in Polling mode');
        setupListeners();
    }
} else {
    console.log('[Telegram] Warning: TELEGRAM_BOT_TOKEN not set, bot not initialized');
}

function setupListeners() {
    if (!bot) return;

    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const connectToken = match[1];
        handleStartCommand(chatId, connectToken);
    });

    bot.onText(/^\/start$/, (msg) => {
        bot.sendMessage(msg.chat.id, "👋 Hello! Please use the 'Connect Telegram' button on the website to link your account.\n\n🔗 Visit the Settings page on the Contest Reminder website to get started.");
    });
}

async function handleStartCommand(chatId, connectToken) {
    if (!connectToken) return;
    console.log(`[Telegram] Processing start with token: ${connectToken}`);
    try {
        let user = await User.findOne({ clerkId: connectToken });
        if (user) {
            user.telegramChatId = String(chatId);
            user.preferences.telegram = true;
            const savedUser = await user.save();
            if (savedUser.telegramChatId === String(chatId)) {
                bot.sendMessage(chatId, "✅ Success! Your Telegram account has been linked to your Contest Reminder account.");
            } else {
                bot.sendMessage(chatId, "⚠️ There was an issue saving your connection. Please try again.");
            }
        } else {
            bot.sendMessage(chatId, "❌ Could not identify user. Make sure you're logged in on the website first.");
        }
    } catch (err) {
        console.error("[Telegram] Bot Error:", err);
        bot.sendMessage(chatId, "❌ An error occurred while linking. Please try again later.");
    }
}

const handleWebhookUpdate = (update) => {
    if (!bot) return;
    bot.processUpdate(update);
};

const sendTelegramMessage = async (chatId, text) => {
    if (!bot || !chatId) return;
    try {
        await bot.sendMessage(chatId, text);
    } catch (error) {
        console.error(`Telegram Send Error to ${chatId}:`, error.message);
    }
};

module.exports = { sendTelegramMessage, bot, handleWebhookUpdate };
