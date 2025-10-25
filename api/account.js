const crypto = require('crypto');

// 币安API配置
const BINANCE_API_BASEURL = 'https://api.binance.com';
const BINANCE_FUTURES_URL = 'https://fapi.binance.com';
const BINANCE_TESTNET_FUTURES_URL = 'https://testnet.binancefuture.com';

// 生成币安API签名
function generateSignature(queryString, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// 获取账户信息（合约）
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
        const baseUrl = useTestnet ? BINANCE_TESTNET_FUTURES_URL : BINANCE_FUTURES_URL;
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = generateSignature(queryString, secretKey);

        const response = await fetch(`${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: '获取账户信息失败',
                details: errorData
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('账户信息获取失败:', error);
        res.status(500).json({
            error: '获取账户信息失败',
            details: error.message
        });
    }
};