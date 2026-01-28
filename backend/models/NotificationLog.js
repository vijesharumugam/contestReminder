const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
    type: { type: String, enum: ['daily', '30m'], required: true },
    sentAt: { type: Date, default: Date.now }
});

// Compound index to quickly check if sent
NotificationLogSchema.index({ userId: 1, contestId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
