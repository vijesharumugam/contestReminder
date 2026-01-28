const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Contest Reminder" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        return false;
    }
};

module.exports = { sendEmail };
