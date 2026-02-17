const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Contest = require('./models/Contest');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const now = new Date();
        console.log('Current Server Time:', now.toString());

        const contests = await Contest.find({
            platform: 'CodeChef',
            startTime: { $gte: now }
        }).sort({ startTime: 1 });

        console.log(`Found ${contests.length} upcoming CodeChef contests:`);
        contests.forEach(c => {
            console.log(`- ${c.name} (${c.startTime})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
