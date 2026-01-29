const nodemailer = require('nodemailer');

// Validate email configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('[Mailer] Warning: GMAIL_USER or GMAIL_PASS not configured. Email sending will fail.');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    if (!GMAIL_USER || !GMAIL_PASS) {
        console.error('[Mailer] Cannot send email: credentials not configured');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Contest Reminder" <${GMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`[Mailer] Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[Mailer] Error sending email to ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };
