/**
 * 测试币安API：不传symbol参数获取所有交易记录
 */

require('dotenv').config();

const crypto = require('crypto');
const fetch = require('node-fetch');

// 生成签名
function generateSignature(queryString, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// 测试不传symbol参数的API调用
async function testAllTradesAPI() {
    console.log('=== 测试不传symbol的API调用 ===');

    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    const baseUrl = 'https://fapi.binance.com'; // 使用主网测试

    if (!apiKey || !secretKey) {
        console.log('❌ 需要配置API密钥');
        return false;
    }

    try {
        // 构建不带symbol的查询参数
        const timestamp = Date.now();
        const params = new URLSearchParams({
            limit: '5', // 只获取5条用于测试
            timestamp: timestamp.toString()
        });

        const queryString = params.toString();
        const signature = generateSignature(queryString, secretKey);

        console.log('请求URL:', `${baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`);

        const response = await fetch(`${baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`, {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        });

        console.log('响应状态:', response.status);

        if (response.ok) {
            const trades = await response.json();
            console.log('✅ 成功获取交易记录，数量:', trades.length);

            if (trades.length > 0) {
                console.log('交易记录样例:');
                trades.slice(0, 3).forEach(trade => {
                    console.log(`  ${trade.symbol}: ${trade.side} ${trade.qty}@${trade.price}`);
                });
            }

            // 检查是否包含不同币种
            const symbols = [...new Set(trades.map(t => t.symbol))];
            console.log('包含的币种:', symbols);

            return true;
        } else {
            const errorData = await response.text();
            console.log('❌ API调用失败:', response.status);
            console.log('错误响应:', errorData);
            return false;
        }

    } catch (error) {
        console.error('❌ 请求出错:', error.message);
        return false;
    }
}

// 运行测试
async function runTest() {
    console.log('币安全交易API测试');
    console.log('==================');

    const success = await testAllTradesAPI();

    console.log('\n=== 测试结果 ===');
    console.log(success ? '✅ 成功：可以获取所有交易记录' : '❌ 失败：不支持不传symbol参数');

    if (success) {
        console.log('\n🎯 建议：可以直接调用 /fapi/v1/userTrades 获取所有交易，无需枚举币种！');
    }
}

runTest().catch(error => {
    console.error('测试执行失败:', error);
});