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

        // 首先获取所有持仓,以便获取交易的币种
        const timestamp = Date.now();
        const positionQueryString = `timestamp=${timestamp}`;
        const positionSignature = generateSignature(positionQueryString, secretKey);

        const positionsResponse = await fetch(`${baseUrl}/fapi/v2/positionRisk?${positionQueryString}&signature=${positionSignature}`, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        if (!positionsResponse.ok) {
            const errorData = await positionsResponse.json();
            return res.status(positionsResponse.status).json({
                error: '获取持仓信息失败',
                details: errorData
            });
        }

        const positions = await positionsResponse.json();
        
        // 获取所有有持仓或最近有交易的币种
        const symbols = positions
            .filter(pos => parseFloat(pos.positionAmt) !== 0 || parseFloat(pos.notional) !== 0)
            .map(pos => pos.symbol);

        // 如果没有持仓,尝试获取最近的交易记录(使用常见的交易对)
        const tradingSymbols = symbols.length > 0 ? symbols : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

        // 获取每个币种的交易记录
        const allTrades = [];
        for (const symbol of tradingSymbols) {
            const tradeTimestamp = Date.now();
            const params = new URLSearchParams({
                symbol: symbol,
                limit: limit.toString(),
                timestamp: tradeTimestamp.toString()
            });

            const queryString = params.toString();
            const signature = generateSignature(queryString, secretKey);

            try {
                const response = await fetch(`${baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`, {
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    }
                });

                if (response.ok) {
                    const trades = await response.json();
                    allTrades.push(...trades);
                }
            } catch (err) {
                console.error(`获取 ${symbol} 交易记录失败:`, err);
            }
        }

        // 按时间倒序排列（最新的在前面）并限制数量
        const sortedTrades = allTrades
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