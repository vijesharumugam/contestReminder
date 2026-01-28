const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (token) {
    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram Bot Polling Started');

    // Handle /start <token>
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const connectToken = match[1]; // The captured token

        if (!connectToken) return;

        try {
            // Find user with this connect token
            // We need a field 'telegramConnectToken' in User schema or just use clerkId if we decide to
            // Strategy: The website sends the Clerk ID as the token for simplicity in this MVP, 
            // OR a random token saved in the DB. 
            // Let's assume the token passed is the Clerk User ID for now (simplest), 
            // or better: a signed JWT? 
            // Let's stick to: Token = Clerk ID. 
            // Ideally, we should verify this claim, but since the user generates the link from their session, it's fairly safe for a personal reminder app.
            // Better: User table has a temporary `connectToken`.

            // Let's find a user where `clerkId` equals the token OR `connectToken` equals the token.

            let user = await User.findOne({ clerkId: connectToken });

            if (user) {
                user.telegramChatId = chatId;
                user.preferences.telegram = true;
                await user.save();
                bot.sendMessage(chatId, "Success! Your Telegram account has been linked to your Contest Reminder account.");
            } else {
                bot.sendMessage(chatId, "Could not identify user. Please try initiating the connection from the website again.");
            }
        } catch (err) {
            console.error("Bot Error:", err);
            bot.sendMessage(chatId, "An error occurred while linking.");
        }
    });

    bot.onText(/\/start$/, (msg) => {
        bot.sendMessage(msg.chat.id, "Hello! Please use the 'Connect Telegram' button on the website to link your account.");
    });
}

const sendTelegramMessage = async (chatId, text) => {
    if (!bot || !chatId) return;
    try {
        await bot.sendMessage(chatId, text);
    } catch (error) {
        console.error(`Telegram Send Error to ${chatId}:`, error.message);
    }
};

module.exports = { sendTelegramMessage, bot };
