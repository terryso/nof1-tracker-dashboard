/**
 * 测试：验证交易API必须包含PUMPUSDT的交易记录
 */

// 模拟当前API逻辑中的币种选择
function testCurrentSymbolSelection() {
    console.log('=== 测试当前币种选择逻辑 ===');

    // 模拟当前持仓为空（PUMPUSDT已平仓的情况）
    const symbols = [];

    // 当前逻辑：如果没有持仓，使用默认币种
    const tradingSymbols = symbols.length > 0 ? symbols : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

    console.log('当前持仓币种:', symbols.length > 0 ? symbols : '无持仓');
    console.log('选择的交易币种:', tradingSymbols);
    console.log('是否包含PUMPUSDT:', tradingSymbols.includes('PUMPUSDT') ? '✅' : '❌');

    return tradingSymbols.includes('PUMPUSDT');
}

// 测试要求：PUMPUSDT必须在交易记录中被包含
function testPumpUsdtRequirement() {
    console.log('\n=== 测试PUMPUSDT包含要求 ===');
    console.log('用户需求：PUMPUSDT的交易记录应该显示在最近25笔交易中');
    console.log('预期结果：交易API必须查询PUMPUSDT币种');

    const currentIncludes = testCurrentSymbolSelection();

    console.log('\n测试结果:');
    if (currentIncludes) {
        console.log('✅ 通过：当前实现包含PUMPUSDT');
        return true;
    } else {
        console.log('❌ 失败：当前实现不包含PUMPUSDT');
        console.log('修复建议：在默认币种列表中添加PUMPUSDT');
        return false;
    }
}

// 运行测试
console.log('PUMPUSDT包含性测试');
console.log('==================');

const result = testPumpUsdtRequirement();

process.exit(result ? 0 : 1);