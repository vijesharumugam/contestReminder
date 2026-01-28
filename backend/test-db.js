const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    console.log('URI:', process.env.MONGODB_URI ? 'FOUND' : 'NOT FOUND');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds
        });
        console.log('Connected successfully');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

test();
