// 交易配置文件
// 在这里修改初始资金和跟单日期，修改后需要重启服务器

const TRADING_CONFIG = {
    // 初始资金配置
    initialAssetValue: 140,        // 初始钱包余额 (USDT)
    initialAssetValueCurrency: 'USDT',

    // 跟单日期配置
    baseDate: '2025-10-25T00:00:00+08:00',  // 基准日期（用于计算盈利和统计的开始时间）
    baseDateDisplay: '2025-10-25',           // 页面显示的日期格式

    // 应用配置
    appName: 'DeepSeek Chat（访问人数太多，API让币安Block - amishai了）',             // 跟踪代理名称
    appTitle: '交易数据监控面板',               // 页面标题

    // 刷新配置
    refreshInterval: 600,                     // 自动刷新间隔（秒）
    refreshButtonText: '下次刷新',             // 刷新倒计时显示文本

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