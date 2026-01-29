const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('MongoDB Connection Error: MONGODB_URI environment variable is not defined');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
