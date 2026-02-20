const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const { authenticate, generateTokenPair, REFRESH_SECRET } = require('../middleware/auth');

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

// ============================================
// RATE LIMITERS — Prevent brute-force attacks
// ============================================

// Strict limiter for login attempts: 5 attempts per 15 minutes
const loginLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.email?.toLowerCase() || req.ip, // Rate limit per email
}) : (req, res, next) => next();

// Registration limiter: 3 accounts per hour per IP
const registerLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Too many accounts created. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
}) : (req, res, next) => next();

// Refresh token limiter: 30 refreshes per 15 minutes
const refreshLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many refresh requests.' },
    standardHeaders: true,
    legacyHeaders: false,
}) : (req, res, next) => next();

// ============================================
// AUTH ROUTES
// ============================================

// --- REGISTER ---
router.post('/register', registerLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ error: "An account with this email already exists" });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Auto-assign admin role for admin email
        const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
        });
        await user.save();

        // Generate token pair
        const tokens = generateTokenPair(user._id);

        console.log(`[Auth] New user registered: ${user.email} (role: ${role})`);

        res.status(201).json({
            ...tokens,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('[Auth] Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- LOGIN ---
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        // Generate token pair — extended refresh if "Remember Me" checked
        const tokens = generateTokenPair(user._id, !!rememberMe);

        console.log(`[Auth] Login: ${user.email} (rememberMe: ${!!rememberMe})`);

        res.json({
            ...tokens,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- REFRESH TOKEN ---
// Use refresh token to get a new access token (token rotation)
router.post('/refresh', refreshLimiter, async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token is required" });

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        // Ensure it's actually a refresh token
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(401).json({ error: "User not found" });

        // Token rotation: issue a completely new pair
        const tokens = generateTokenPair(user._id);

        res.json({
            ...tokens,
            user: sanitizeUser(user),
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expired. Please sign in again.', code: 'REFRESH_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// --- GET CURRENT USER ---
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CHANGE PASSWORD ---
router.put('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ error: "New password must be different from current password" });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Issue new tokens (invalidates old ones conceptually)
        const tokens = generateTokenPair(user._id);

        console.log(`[Auth] Password changed for: ${user.email}`);

        res.json({
            message: "Password changed successfully",
            ...tokens,
        });
    } catch (error) {
        console.error('[Auth] Change password error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- UPDATE PROFILE (email change) ---
router.put('/profile', authenticate, async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
        // Check if email is already taken by another user
        const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
        if (existing) {
            return res.status(400).json({ error: "This email is already in use" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { email: email.toLowerCase() },
            { new: true }
        ).select('-password');

        console.log(`[Auth] Profile updated for user ${req.user._id}: email → ${email}`);

        res.json(sanitizeUser(user));
    } catch (error) {
        console.error('[Auth] Profile update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- DELETE ACCOUNT ---
router.delete('/account', authenticate, async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required to delete your account" });

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify password before deletion
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        await User.findByIdAndDelete(req.user._id);
        console.log(`[Auth] Account deleted: ${user.email}`);

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error('[Auth] Delete account error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HELPER
// ============================================
function sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
}

module.exports = router;
