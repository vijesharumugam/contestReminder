/**
 * Seed script: Creates the admin user if not exists.
 * Run: node scripts/seedAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'vijesharumugam26@gmail.com';
const ADMIN_PASSWORD = '12345678';

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[Seed] Connected to MongoDB');

        // Check if admin already exists
        const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
        if (existing) {
            console.log(`[Seed] Admin user already exists: ${existing.email} (role: ${existing.role})`);

            // Update password and role using findOneAndUpdate to bypass validation on legacy fields
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

            await User.findOneAndUpdate(
                { email: ADMIN_EMAIL.toLowerCase() },
                { $set: { password: hashedPassword, role: 'admin' } }
            );
            console.log(`[Seed] Admin role & password updated`);
        } else {
            // Create the admin user
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

            const admin = new User({
                email: ADMIN_EMAIL.toLowerCase(),
                password: hashedPassword,
                role: 'admin',
            });
            await admin.save();
            console.log(`[Seed] ✅ Admin user created: ${admin.email}`);
        }

        console.log(`\n  Admin Credentials:`);
        console.log(`  Email:    ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log(`  Role:     admin\n`);

    } catch (error) {
        console.error('[Seed] Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('[Seed] Disconnected from MongoDB');
    }
}

seedAdmin();
