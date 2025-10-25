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

// 获取当前仓位信息
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
        const recvWindow = 10000; // 10秒时间窗口
        const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
        const signature = generateSignature(queryString, secretKey);

        const response = await fetch(`${baseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: '获取仓位信息失败',
                details: errorData
            });
        }

        const data = await response.json();

        // 只返回有持仓的仓位（过滤掉positionAmt为0的）
        const activePositions = data.filter(position =>
            parseFloat(position.positionAmt) !== 0
        );

        // 调试日志：查看第一个持仓的数据结构
        if (activePositions.length > 0) {
            console.log('持仓数据示例:', JSON.stringify(activePositions[0], null, 2));
        }

        res.json(activePositions);

    } catch (error) {
        console.error('仓位信息获取失败:', error);
        res.status(500).json({
            error: '获取仓位信息失败',
            details: error.message
        });
    }
};