const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    telegramChatId: { type: String },
    preferences: {
        email: { type: Boolean, default: true },
        telegram: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
