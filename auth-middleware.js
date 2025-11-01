// Simple authentication middleware
// This file is separate and won't conflict with upstream merges

const crypto = require('crypto');

// Hash password using PBKDF2
function hashPassword(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
    return `${actualSalt}:${hash}`;
}

// Verify password against hash
function verifyPassword(password, storedHash) {
    try {
        const [salt, hash] = storedHash.split(':');
        const newHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === newHash;
    } catch (error) {
        return false;
    }
}

// Generate a simple token
function generateToken(username) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const data = `${username}:${timestamp}:${random}`;
    return Buffer.from(data).toString('base64');
}

// Verify token
function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [username, timestamp] = decoded.split(':');

        // Token valid for 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge > maxAge) {
            return null;
        }

        return username;
    } catch (error) {
        return null;
    }
}

// Authentication middleware
function authMiddleware(req, res, next) {
    // Skip auth for login page, login API, and static files
    if (req.path === '/login.html' ||
        req.path === '/api/login' ||
        req.path === '/generate-password.html' ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.js') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.endsWith('.ico')) {
        return next();
    }

    // Check for token in Authorization header or X-Auth-Token header
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.headers['x-auth-token'] ||
                  req.query.token; // Also check query params for initial load

    console.log('Auth check for:', req.path, 'Token present:', !!token);

    if (!token) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        console.log('No token, redirecting to login');
        return res.redirect('/login.html');
    }

    const username = verifyToken(token);
    if (!username) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.log('Invalid token, redirecting to login');
        return res.redirect('/login.html');
    }

    console.log('Auth successful for user:', username);
    req.user = username;
    next();
}

// Login handler
async function loginHandler(req, res) {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, hasPassword: !!password });

    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPasswordHash = process.env.DASHBOARD_PASSWORD_HASH;

    // For backward compatibility, support plain text password (not recommended)
    const plainPassword = process.env.DASHBOARD_PASSWORD;

    console.log('Auth config:', {
        validUsername,
        hasHash: !!validPasswordHash,
        hasPlainPassword: !!plainPassword
    });

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required'
        });
    }

    let isValid = false;

    // Check username
    if (username === validUsername) {
        console.log('Username matches');
        // First try hashed password (recommended)
        if (validPasswordHash) {
            isValid = verifyPassword(password, validPasswordHash);
            console.log('Hash verification result:', isValid);
        }
        // Fallback to plain text (for backward compatibility)
        else if (plainPassword) {
            isValid = (password === plainPassword);
            console.warn('WARNING: Using plain text password. Please use DASHBOARD_PASSWORD_HASH instead.');
        } else {
            console.error('ERROR: No password configured in environment variables!');
        }
    } else {
        console.log('Username does not match. Expected:', validUsername, 'Got:', username);
    }

    if (isValid) {
        const token = generateToken(username);
        console.log('Login successful, token generated');
        res.json({
            success: true,
            token,
            message: 'Login successful'
        });
    } else {
        console.log('Login failed');
        res.status(401).json({
            success: false,
            error: 'Invalid username or password'
        });
    }
}

module.exports = {
    authMiddleware,
    loginHandler,
    generateToken,
    verifyToken,
    hashPassword,
    verifyPassword
};