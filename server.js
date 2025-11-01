require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ===== AUTH: Add this line after merge =====
const { authMiddleware, loginHandler } = require('./auth-middleware');
// ===== END AUTH =====

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ===== AUTH: Add these lines after merge =====
// Login endpoint
app.post('/api/login', loginHandler);

// Apply auth middleware to all routes except login
app.use(authMiddleware);
// ===== END AUTH =====

// API路由
app.use('/api', async (req, res, next) => {
    try {
        const apiPath = req.path.substring(1);
        const apiFile = path.join(__dirname, 'api', `${apiPath}.js`);

        if (!fs.existsSync(apiFile)) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }

        delete require.cache[require.resolve(apiFile)];
        const apiHandler = require(apiFile);
        await apiHandler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'binance-tracker.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
