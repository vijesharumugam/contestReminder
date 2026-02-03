const nodemailer = require('nodemailer');

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`[Mailer] Initializing email service with provider: ${EMAIL_PROVIDER} (${NODE_ENV})`);

/**
 * Create transporter based on the configured email provider
 * Supports: Gmail, SendGrid, Resend, Mailgun
 */
const createTransporter = () => {
    const provider = EMAIL_PROVIDER.toLowerCase();

    switch (provider) {
        case 'sendgrid':
            return createSendGridTransporter();

        case 'resend':
            return createResendTransporter();

        case 'mailgun':
            return createMailgunTransporter();

        case 'gmail':
        default:
            return createGmailTransporter();
    }
};

/**
 * Gmail SMTP Transporter
 * Works well in development, may have issues in production
 * Supports custom SMTP_HOST and SMTP_PORT environment variables
 */
const createGmailTransporter = () => {
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_PASS = process.env.GMAIL_PASS;
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
    const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for port 465, false for 587

    if (!GMAIL_USER || !GMAIL_PASS) {
        console.warn('[Mailer] Gmail credentials not configured');
        return null;
    }

    if (NODE_ENV === 'production') {
        console.warn('[Mailer] WARNING: Gmail SMTP may not work reliably in production. Consider using SendGrid, Resend, or Mailgun.');
    }

    console.log(`[Mailer] Creating Gmail transporter for: ${GMAIL_USER}`);
    console.log(`[Mailer] SMTP Configuration: ${SMTP_HOST}:${SMTP_PORT} (secure: ${SMTP_SECURE})`);

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE, // true for 465, false for other ports
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS
        },
        // Production-friendly settings
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,      // 60 seconds
        // TLS options for production environments
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
            minVersion: 'TLSv1.2'
        },
        // Enable debug logging in production
        debug: NODE_ENV === 'production',
        logger: NODE_ENV === 'production'
    });
};

/**
 * SendGrid SMTP Transporter
 * Recommended for production - 100 emails/day free
 * Get API key from: https://sendgrid.com
 */
const createSendGridTransporter = () => {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
        console.error('[Mailer] SendGrid API key not configured');
        return null;
    }

    return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: SENDGRID_API_KEY
        }
    });
};

/**
 * Resend SMTP Transporter
 * Alternative for production - 100 emails/day free
 * Get API key from: https://resend.com
 */
const createResendTransporter = () => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('[Mailer] Resend API key not configured');
        return null;
    }

    return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
            user: 'resend',
            pass: RESEND_API_KEY
        }
    });
};

/**
 * Mailgun SMTP Transporter
 * Alternative for production
 * Get credentials from: https://mailgun.com
 */
const createMailgunTransporter = () => {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        console.error('[Mailer] Mailgun credentials not configured');
        return null;
    }

    return nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
            user: `postmaster@${MAILGUN_DOMAIN}`,
            pass: MAILGUN_API_KEY
        }
    });
};

/**
 * Get the 'from' email address based on provider
 */
const getFromAddress = () => {
    const provider = EMAIL_PROVIDER.toLowerCase();

    switch (provider) {
        case 'sendgrid':
            return process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER;

        case 'resend':
            return process.env.RESEND_FROM_EMAIL || process.env.GMAIL_USER;

        case 'mailgun':
            return process.env.MAILGUN_FROM_EMAIL || process.env.GMAIL_USER;

        case 'gmail':
        default:
            return process.env.GMAIL_USER;
    }
};

/**
 * Get the 'from' name
 */
const getFromName = () => {
    const provider = EMAIL_PROVIDER.toLowerCase();

    switch (provider) {
        case 'sendgrid':
            return process.env.SENDGRID_FROM_NAME || 'Contest Reminder';

        default:
            return 'Contest Reminder';
    }
};

// Create the transporter
const transporter = createTransporter();

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, html) => {
    if (!transporter) {
        const error = `[Mailer] Email service not configured. Provider: ${EMAIL_PROVIDER}`;
        console.error(error);
        throw new Error('Email service not configured. Please check your environment variables.');
    }

    const fromEmail = getFromAddress();
    const fromName = getFromName();

    if (!fromEmail) {
        console.error('[Mailer] From email address not configured');
        throw new Error('From email address not configured');
    }

    try {
        console.log(`[Mailer] Sending email to ${to} via ${EMAIL_PROVIDER}...`);
        console.log(`[Mailer] From: ${fromName} <${fromEmail}>`);
        console.log(`[Mailer] Subject: ${subject}`);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email sending timeout after 60 seconds')), 60000);
        });

        // Race between sending email and timeout
        const info = await Promise.race([
            transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html
            }),
            timeoutPromise
        ]);

        console.log(`[Mailer] ✅ Email sent successfully to ${to} via ${EMAIL_PROVIDER}`);
        console.log(`[Mailer] Message ID: ${info.messageId}`);
        console.log(`[Mailer] Response: ${info.response}`);
        return true;
    } catch (error) {
        console.error(`[Mailer] ❌ Error sending email to ${to} via ${EMAIL_PROVIDER}:`, error.message);
        console.error(`[Mailer] Error code: ${error.code}`);
        console.error(`[Mailer] Error command: ${error.command}`);

        // Provide helpful error messages
        if (error.message.includes('timeout')) {
            console.error('[Mailer] Email service timed out. This may indicate:');
            console.error('  - Network issues or firewall blocking SMTP ports');
            console.error('  - Gmail blocking datacenter IPs (common on Render/Vercel)');
            console.error('  - Incorrect SMTP server settings');
            console.error('  → SOLUTION: Switch to SendGrid, Resend, or Mailgun for production');
        } else if (error.code === 'EAUTH') {
            console.error('[Mailer] Authentication failed. Please check:');
            console.error('  - GMAIL_USER is correct');
            console.error('  - GMAIL_PASS is a valid App Password (not regular password)');
            console.error('  - 2FA is enabled on your Google account');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.error('[Mailer] Connection failed. This usually means:');
            console.error('  - Gmail SMTP is blocked by your hosting provider');
            console.error('  - Port 587 or 465 is not accessible');
            console.error('  → SOLUTION: Use SendGrid, Resend, or Mailgun instead');
        } else if (error.code === 'ESOCKET') {
            console.error('[Mailer] Socket error. Network connectivity issue.');
        }

        throw error;
    }
};

/**
 * Verify email configuration
 * Call this on startup to ensure email service is working
 */
const verifyEmailConfig = async () => {
    if (!transporter) {
        console.warn('[Mailer] ⚠️  Email service not configured - emails will not be sent');
        return false;
    }

    try {
        await transporter.verify();
        console.log(`[Mailer] ✅ Email service verified successfully (Provider: ${EMAIL_PROVIDER})`);
        return true;
    } catch (error) {
        console.error(`[Mailer] ❌ Email service verification failed (Provider: ${EMAIL_PROVIDER}):`, error.message);
        console.error('[Mailer] Please check your email configuration in environment variables');
        return false;
    }
};

module.exports = {
    sendEmail,
    verifyEmailConfig
};
