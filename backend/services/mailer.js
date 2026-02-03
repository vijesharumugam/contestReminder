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
 */
const createGmailTransporter = () => {
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_PASS = process.env.GMAIL_PASS;

    if (!GMAIL_USER || !GMAIL_PASS) {
        console.warn('[Mailer] Gmail credentials not configured');
        return null;
    }

    if (NODE_ENV === 'production') {
        console.warn('[Mailer] WARNING: Gmail SMTP may not work reliably in production. Consider using SendGrid, Resend, or Mailgun.');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
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

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email sending timeout after 45 seconds')), 45000);
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
        return true;
    } catch (error) {
        console.error(`[Mailer] ❌ Error sending email to ${to} via ${EMAIL_PROVIDER}:`, error.message);

        // Provide helpful error messages
        if (error.message.includes('timeout')) {
            console.error('[Mailer] Email service timed out. This may indicate network issues or incorrect credentials.');
        } else if (error.code === 'EAUTH') {
            console.error('[Mailer] Authentication failed. Please check your credentials.');
        } else if (error.code === 'ECONNECTION') {
            console.error('[Mailer] Connection failed. Please check your network and SMTP settings.');
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
