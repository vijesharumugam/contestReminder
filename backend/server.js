// Load environment variables FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Core dependencies
const express = require('express');
const cors = require('cors');

// Internal modules
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');
const cronRoutes = require('./routes/cron');
const { fetchAndSaveContests } = require('./services/clistService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);

app.get('/', (req, res) => {
    res.send('Contest Reminder API Running');
});

// Manual trigger for testing (Optional)
app.get('/api/trigger-fetch', async (req, res) => {
    await fetchAndSaveContests();
    res.send('Fetch triggered');
});

// Start Server (only when running locally, not on Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Note: Cron jobs are handled by Vercel Cron in production');
    });
}

// Export for Vercel Serverless
module.exports = app;
