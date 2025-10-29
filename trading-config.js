// 交易配置文件
// 在这里修改初始资金和跟单日期，修改后需要重启服务器

const TRADING_CONFIG = {
    // 初始资金配置
    initialAssetValue: 140,        // 初始钱包余额 (USDT)
    initialAssetValueCurrency: 'USDT',

    // 跟单日期配置
    baseDate: '2025-10-25T00:00:00+08:00',  // 基准日期（用于计算盈利和统计的开始时间）
    baseDateDisplay: '2025-10-25',           // 页面显示的日期格式

    // 显示文本配置
    display: {
        dateTextPrefix: '自',
        dateTextSuffix: '以来'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = TRADING_CONFIG;
} else {
    // 浏览器环境
    window.TRADING_CONFIG = TRADING_CONFIG;
}