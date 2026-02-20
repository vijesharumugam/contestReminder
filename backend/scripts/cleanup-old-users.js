/**
 * cleanup-old-users.js
 * ─────────────────────────────────────────────────────────
 * Deletes ALL non-admin users from the database.
 * The admin user (role: 'admin') is NEVER touched.
 *
 * Run from the backend directory:
 *   node scripts/cleanup-old-users.js
 *
 * This is safe to run against live DB — it previews what
 * will be deleted before asking for confirmation.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const readline = require('readline');

// ─── Load User model directly (no server needed) ───────────
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    telegramChatId: { type: String },
    pushSubscriptions: [{ type: mongoose.Schema.Types.Mixed }],
    fcmTokens: [{ type: String }],
    preferences: {
        push: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// ─── Helper: ask a question ─────────────────────────────────
function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ContestRemind — Old User Cleanup Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not set in .env');
        process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected!\n');

    // 2. Show all users first (preview)
    const allUsers = await User.find({}, 'email role createdAt').sort({ createdAt: 1 });

    if (allUsers.length === 0) {
        console.log('ℹ️  No users found in the database. Nothing to clean up.');
        await mongoose.disconnect();
        return;
    }

    console.log(`📋 Found ${allUsers.length} user(s) in the database:\n`);

    const adminUsers = allUsers.filter(u => u.role === 'admin');
    const normalUsers = allUsers.filter(u => u.role !== 'admin');

    // Print admin users (will be KEPT)
    if (adminUsers.length > 0) {
        console.log('  ✅ ADMIN users (will be KEPT):');
        adminUsers.forEach(u => {
            console.log(`     • ${u.email}  [role: ${u.role}]  [joined: ${u.createdAt.toLocaleDateString()}]`);
        });
    }

    console.log('');

    // Print normal users (will be DELETED)
    if (normalUsers.length === 0) {
        console.log('  ℹ️  No non-admin users to delete.');
        await mongoose.disconnect();
        return;
    }

    console.log(`  🗑️  Non-admin users (will be DELETED — ${normalUsers.length} total):`);
    normalUsers.forEach(u => {
        console.log(`     • ${u.email}  [role: ${u.role}]  [joined: ${u.createdAt.toLocaleDateString()}]`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⚠️  This will permanently delete ${normalUsers.length} user(s).`);
    console.log('   Admin account(s) will NOT be affected.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. Confirm before deleting
    const answer = await ask('  Type "yes" to confirm deletion, or anything else to cancel: ');

    if (answer.toLowerCase() !== 'yes') {
        console.log('\n🚫 Cancelled. No users were deleted.\n');
        await mongoose.disconnect();
        return;
    }

    // 4. Delete only non-admin users
    console.log('\n🗑️  Deleting non-admin users...');
    const result = await User.deleteMany({ role: { $ne: 'admin' } });

    console.log(`\n✅ Done! Deleted ${result.deletedCount} user(s).`);

    // 5. Confirm what remains
    const remaining = await User.find({}, 'email role').lean();
    console.log(`\n📋 Remaining users in database (${remaining.length}):`);
    remaining.forEach(u => {
        console.log(`   • ${u.email}  [role: ${u.role}]`);
    });

    console.log('\n🎉 Database is now clean. Fresh users can sign up with JWT auth.\n');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
