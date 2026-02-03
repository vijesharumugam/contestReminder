const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendEmail } = require('../services/mailer');
const { sendTelegramMessage } = require('../services/telegramService');

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

// Middleware to check if the request comes from the admin
// In a real app, you would verify the Clerk JWT token here.
// For now, we'll keep it simple as per instructions.
const isAdmin = (req, res, next) => {
    // This expects the frontend to send the admin email in headers for verification
    const requesterEmail = req.headers['x-admin-email'];
    if (requesterEmail === ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).json({ error: "Access Denied: Admins Only" });
    }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Diagnostic endpoint to check email configuration
router.get('/email-config', isAdmin, async (req, res) => {
    try {
        const config = {
            provider: process.env.EMAIL_PROVIDER || 'gmail',
            nodeEnv: process.env.NODE_ENV || 'development',
            gmailUser: process.env.GMAIL_USER ? '✓ Configured' : '✗ Missing',
            gmailPass: process.env.GMAIL_PASS ? '✓ Configured' : '✗ Missing',
            sendgridKey: process.env.SENDGRID_API_KEY ? '✓ Configured' : '✗ Missing',
        };

        // Try to verify the transporter
        const { verifyEmailConfig } = require('../services/mailer');
        const verified = await verifyEmailConfig();

        res.json({
            config,
            transporterVerified: verified,
            message: verified ? 'Email service is ready' : 'Email service verification failed'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            config: {
                provider: process.env.EMAIL_PROVIDER || 'gmail',
                nodeEnv: process.env.NODE_ENV || 'development'
            }
        });
    }
});

// Test Email
router.post('/test-email', isAdmin, async (req, res) => {
    const { email } = req.body;

    // Log environment info for debugging
    console.log('[Admin] Test Email Request:', {
        to: email,
        provider: process.env.EMAIL_PROVIDER,
        gmailUser: process.env.GMAIL_USER ? '✓ Set' : '✗ Missing',
        gmailPass: process.env.GMAIL_PASS ? '✓ Set' : '✗ Missing',
        nodeEnv: process.env.NODE_ENV
    });

    try {
        console.log(`[Admin] Attempting to send test email to ${email}...`);
        await sendEmail(email, "Test Reminder", "<h3>Test Notification</h3><p>This is a test reminder from your Contest Reminder System.</p>");
        console.log(`[Admin] ✅ Test email sent successfully to ${email}`);
        res.json({
            success: true,
            message: `Email sent to ${email}`,
            provider: process.env.EMAIL_PROVIDER || 'gmail'
        });
    } catch (error) {
        console.error(`[Admin] ❌ Test email failed for ${email}:`, error);
        res.status(500).json({
            error: error.message,
            details: {
                code: error.code,
                command: error.command,
                provider: process.env.EMAIL_PROVIDER || 'gmail'
            }
        });
    }
});

// Test Telegram
router.post('/test-telegram', isAdmin, async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: "No Chat ID linked" });
    try {
        await sendTelegramMessage(chatId, "🔔 Test Notification: This is a test message from your Contest Reminder System.");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
