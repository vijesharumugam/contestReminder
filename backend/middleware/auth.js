const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const getJwtSecret = () => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
    }
    const ephemeral = crypto.randomBytes(48).toString('hex');
    console.warn('[Auth] JWT_SECRET missing. Using ephemeral development secret.');
    return ephemeral;
};

const JWT_SECRET = getJwtSecret();
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';

// Token Lifetimes
const ACCESS_TOKEN_EXPIRY = '15m';           // Short-lived for security
const REFRESH_TOKEN_EXPIRY = '30d';          // Long-lived for convenience
const REMEMBER_ME_REFRESH_EXPIRY = '90d';    // Extended for "Remember Me"
const TELEGRAM_CONNECT_EXPIRY = '10m';

/**
 * Generate an access token (short-lived).
 */
const generateAccessToken = (userId) => {
    return jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generate a refresh token (long-lived).
 * @param {string} userId
 * @param {boolean} rememberMe - Extend the refresh token lifetime
 */
const generateRefreshToken = (userId, rememberMe = false) => {
    const expiry = rememberMe ? REMEMBER_ME_REFRESH_EXPIRY : REFRESH_TOKEN_EXPIRY;
    return jwt.sign({ userId, type: 'refresh', rememberMe: !!rememberMe }, REFRESH_SECRET, { expiresIn: expiry });
};

/**
 * Generate both tokens as a pair.
 */
const generateTokenPair = (userId, rememberMe = false) => {
    return {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId, rememberMe),
    };
};

const generateTelegramConnectToken = (userId) => {
    return jwt.sign({ userId, type: 'telegram_connect' }, JWT_SECRET, { expiresIn: TELEGRAM_CONNECT_EXPIRY });
};

const verifyTelegramConnectToken = (token) => {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'telegram_connect') {
        throw new Error('Invalid telegram connect token type');
    }
    return decoded;
};

/**
 * Middleware to verify JWT access token and attach user to request.
 * Expects header: Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Only accept access tokens (not refresh tokens)
        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type.' });
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

/**
 * Middleware to check if the authenticated user has admin role.
 * Must be used AFTER authenticate middleware.
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: Admins Only' });
    }
};

module.exports = {
    authenticate,
    isAdmin,
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    generateTelegramConnectToken,
    verifyTelegramConnectToken,
    JWT_SECRET,
    REFRESH_SECRET
};
