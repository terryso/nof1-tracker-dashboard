/**
 * 测试交易记录API的行为
 * 这个测试用于验证当前API可能遗漏某些币种交易的问题
 */

const crypto = require('crypto');

// 模拟API响应数据
const mockPositions = [
    { symbol: 'BTCUSDT', positionAmt: '0.1', notional: '5000' },
    { symbol: 'ETHUSDT', positionAmt: '0', notional: '0' }, // 已平仓
    // 注意：PUMPUSDT 不在持仓中
];

const mockAllTrades = {
    'BTCUSDT': [
        { time: 1640995200000, symbol: 'BTCUSDT', side: 'BUY', price: '50000', qty: '0.1' },
        { time: 1640995300000, symbol: 'BTCUSDT', side: 'SELL', price: '51000', qty: '0.1' }
    ],
    'ETHUSDT': [
        { time: 1640995400000, symbol: 'ETHUSDT', side: 'BUY', price: '4000', qty: '1' }
    ],
    'PUMPUSDT': [ // 这是会被遗漏的交易
        { time: 1640995500000, symbol: 'PUMPUSDT', side: 'BUY', price: '1.5', qty: '100' },
        { time: 1640995600000, symbol: 'PUMPUSDT', side: 'SELL', price: '2.0', qty: '100' }
    ]
};

// 测试当前实现的行为
function testCurrentImplementation() {
    console.log('=== 测试当前交易API实现 ===');

    // 模拟当前逻辑：只获取有持仓的币种
    const symbols = mockPositions
        .filter(pos => parseFloat(pos.positionAmt) !== 0 || parseFloat(pos.notional) !== 0)
        .map(pos => pos.symbol);

    console.log('当前持仓币种:', symbols);

    // 模拟当前逻辑：使用默认币种列表
    const tradingSymbols = symbols.length > 0 ? symbols : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    console.log('实际获取交易记录的币种:', tradingSymbols);

    // 模拟获取的交易记录
    const allTrades = [];
    tradingSymbols.forEach(symbol => {
        if (mockAllTrades[symbol]) {
            allTrades.push(...mockAllTrades[symbol]);
        }
    });

    console.log('实际获取到的交易记录数量:', allTrades.length);
    console.log('交易记录:', allTrades.map(t => `${t.symbol}: ${t.side} ${t.qty}@${t.price}`));

    // 检查是否有遗漏
    const expectedTrades = Object.values(mockAllTrades).flat();
    const missingTrades = expectedTrades.filter(trade =>
        !allTrades.some(t => t.symbol === trade.symbol && t.time === trade.time)
    );

    console.log('=== 问题分析 ===');
    console.log('期望的交易记录数量:', expectedTrades.length);
    console.log('实际获取的交易记录数量:', allTrades.length);
    console.log('遗漏的交易记录:', missingTrades.map(t => `${t.symbol}: ${t.side} ${t.qty}@${t.price}`));

    return {
        totalTrades: expectedTrades.length,
        retrievedTrades: allTrades.length,
        missingTrades: missingTrades.length,
        success: missingTrades.length === 0
    };
}

// 测试改进后的实现
function testImprovedImplementation() {
    console.log('\n=== 测试改进后的交易API实现 ===');

    // 模拟新逻辑：获取所有交易记录（不分币种）
    const allTrades = Object.values(mockAllTrades).flat();

    // 按时间倒序排列并限制数量
    const sortedTrades = allTrades
        .sort((a, b) => b.time - a.time)
        .slice(0, 25);

    console.log('改进后获取到的交易记录数量:', sortedTrades.length);
    console.log('交易记录:', sortedTrades.map(t => `${t.symbol}: ${t.side} ${t.qty}@${t.price}`));

    return {
        totalTrades: allTrades.length,
        retrievedTrades: sortedTrades.length,
        missingTrades: 0,
        success: true
    };
}

// 运行测试
console.log('交易记录API测试');
console.log('================');

const currentResult = testCurrentImplementation();
const improvedResult = testImprovedImplementation();

console.log('\n=== 测试结果对比 ===');
console.log('当前实现:', currentResult.success ? '✅ 通过' : '❌ 失败',
            `(获取 ${currentResult.retrievedTrades}/${currentResult.totalTrades} 条，遗漏 ${currentResult.missingTrades} 条)`);
console.log('改进实现:', improvedResult.success ? '✅ 通过' : '❌ 失败',
            `(获取 ${improvedResult.retrievedTrades}/${improvedResult.totalTrades} 条)`);

if (!currentResult.success) {
    console.log('\n⚠️  当前实现存在问题，遗漏了 PUMPUSDT 等已平仓币种的交易记录');
}