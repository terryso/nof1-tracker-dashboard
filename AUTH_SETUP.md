# Authentication Setup Guide

This guide explains how to re-apply authentication after merging from upstream.

## Files Added (won't conflict with upstream):
1. `login.html` - Login page
2. `auth-middleware.js` - Server-side authentication
3. `auth-client.js` - Client-side authentication
4. `AUTH_SETUP.md` - This file

## Minimal Changes to Existing Files:

### 1. server.js
Add these lines at the marked locations:

```javascript
// After other requires (around line 6):
// ===== AUTH: Add this line after merge =====
const { authMiddleware, loginHandler } = require('./auth-middleware');
// ===== END AUTH =====

// After app.use(express.static('.')); (around line 18):
// ===== AUTH: Add these lines after merge =====
// Login endpoint
app.post('/api/login', loginHandler);

// Apply auth middleware to all routes except login
app.use(authMiddleware);
// ===== END AUTH =====
```

### 2. binance-tracker.html
Add this line in the scripts section (around line 165):

```html
<!-- ===== AUTH: Add this line after merge ===== -->
<script src="auth-client.js"></script>
<!-- ===== END AUTH ===== -->
```

### 3. .env.example (and your .env)
Add these lines at the end:

```bash
# ===== AUTH: Add these after merge =====
# Dashboard Login Credentials
DASHBOARD_USERNAME=admin
# Use hashed password (recommended):
DASHBOARD_PASSWORD_HASH=your_password_hash_here
# OR use plain text (not recommended):
# DASHBOARD_PASSWORD=your_plain_password
# ===== END AUTH =====
```

## Environment Variables Setup

### Method 1: Generate Hash via CLI (Recommended - Secure)

1. Run this command to generate a password hash:
   ```bash
   node -e "const crypto = require('crypto'); const password = 'YOUR_PASSWORD_HERE'; const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex'); console.log(salt + ':' + hash);"
   ```

   Replace `YOUR_PASSWORD_HERE` with your actual password.

2. Copy the output hash

3. Edit your `.env` file:
   ```bash
   DASHBOARD_USERNAME=your_username
   DASHBOARD_PASSWORD_HASH=paste_your_hash_here
   ```

### Method 2: Plain Text Password (Not Recommended - Testing Only)

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your credentials:
   ```bash
   DASHBOARD_USERNAME=your_username
   DASHBOARD_PASSWORD=your_plain_password
   ```

⚠️ **Warning:** Plain text passwords are less secure. Use hashed passwords in production!

## Testing Authentication

1. Start the server:
   ```bash
   npm start
   ```

2. Visit `http://localhost:3000` - you should be redirected to login page

3. Login with your credentials from `.env`

4. You'll be redirected to the main dashboard

## After Merging from Upstream

After pulling changes from the main fork:

1. Check if `server.js` was modified in the merge
2. If yes, re-add the 3 marked sections (look for `===== AUTH:` comments)
3. Check if `binance-tracker.html` was modified
4. If yes, re-add the 1 marked script line
5. Your auth files (`login.html`, `auth-middleware.js`, `auth-client.js`) won't be affected

## Disabling Authentication (if needed)

To temporarily disable authentication:

1. Comment out the auth middleware line in `server.js`:
   ```javascript
   // app.use(authMiddleware);
   ```

2. Comment out the auth-client script in `binance-tracker.html`:
   ```html
   <!-- <script src="auth-client.js"></script> -->
   ```

## Security Notes

- Change the default password immediately
- Use a strong password
- Consider using environment variables in production
- Token expires after 24 hours
- For production, consider using JWT or similar robust solution