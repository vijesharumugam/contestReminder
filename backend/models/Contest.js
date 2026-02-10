const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
    externalId: { type: Number, required: true, unique: true }, // CLIST Contest ID
    name: { type: String, required: true },
    platform: { type: String, required: true },
    startTime: { type: Date, required: true, index: true },
    duration: { type: Number, required: true }, // Duration in seconds
    url: { type: String, required: true },
    resourceId: { type: Number, required: true }, // CLIST Resource ID
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', ContestSchema);
