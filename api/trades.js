const crypto = require('crypto');

// 币安API配置
const BINANCE_FUTURES_URL = 'https://fapi.binance.com';
const BINANCE_TESTNET_FUTURES_URL = 'https://testnet.binancefuture.com';

// 生成币安API签名
function generateSignature(queryString, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// 获取用户交易记录（合约）
module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    const useTestnet = process.env.USE_TESTNET === 'true';

    if (!apiKey || !secretKey) {
        return res.status(500).json({ error: 'API密钥未配置' });
    }

    try {
        const { limit = 25 } = req.query;
        const baseUrl = useTestnet ? BINANCE_TESTNET_FUTURES_URL : BINANCE_FUTURES_URL;

        // 直接获取所有交易记录，不限制币种
        const timestamp = Date.now();
        const params = new URLSearchParams({
            limit: limit.toString(),
            timestamp: timestamp.toString()
        });

        const queryString = params.toString();
        const signature = generateSignature(queryString, secretKey);

        const response = await fetch(`${baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: '获取交易记录失败',
                details: errorData
            });
        }

        const trades = await response.json();

        // 过滤掉PUMPUSDT交易记录
        const filteredTrades = trades.filter(trade => trade.symbol !== 'PUMPUSDT');

        // 按时间倒序排列（最新的在前面）
        const sortedTrades = filteredTrades
            .sort((a, b) => b.time - a.time)
            .slice(0, parseInt(limit));

        res.json(sortedTrades);

    } catch (error) {
        console.error('交易记录获取失败:', error);
        res.status(500).json({
            error: '获取交易记录失败',
            details: error.message
        });
    }
};