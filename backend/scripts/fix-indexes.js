const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const User = mongoose.connection.collection('users');

        console.log('Fetching indexes...');
        const indexes = await User.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const clerkIdIndex = indexes.find(idx => idx.name === 'clerkId_1' || idx.key.clerkId);

        if (clerkIdIndex) {
            console.log(`Found clerkId index: ${clerkIdIndex.name}. Dropping...`);
            await User.dropIndex(clerkIdIndex.name);
            console.log('Index dropped successfully.');
        } else {
            console.log('No clerkId index found.');
        }

        // Also check for user_id_1 from clerk
        const userIdIndex = indexes.find(idx => idx.name === 'userId_1');
        if (userIdIndex) {
            console.log('Found old userId index. Dropping...');
            await User.dropIndex('userId_1');
        }

        console.log('Database index fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
}

fixIndexes();
