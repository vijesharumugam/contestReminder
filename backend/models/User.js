const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    telegramChatId: { type: String },
    pushSubscriptions: [{
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    }],
    fcmTokens: [{ type: String }],  // Firebase Cloud Messaging tokens for native app
    preferences: {
        push: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
