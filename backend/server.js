const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initScheduledJobs } = require('./services/scheduler');
const userRoutes = require('./routes/users');
const contestRoutes = require('./routes/contests');
const adminRoutes = require('./routes/admin');
const { fetchAndSaveContests } = require('./services/clistService');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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

app.get('/', (req, res) => {
    res.send('Contest Reminder API Running');
});

// Manual trigger for testing (Optional)
app.get('/api/trigger-fetch', async (req, res) => {
    await fetchAndSaveContests();
    res.send('Fetch triggered');
});

// Start Server & Scheduler
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initScheduledJobs();
});
