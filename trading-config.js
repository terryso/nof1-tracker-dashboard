// 交易配置文件
// 在这里修改初始资金和跟单日期，修改后需要重启服务器

const TRADING_CONFIG = {
    // 初始资金配置
    initialAssetValue: 5000,        // 初始钱包余额 (USDT)
    initialAssetValueCurrency: 'USDT',

    // 跟单日期配置
    baseDate: '2025-11-2T00:00:00+08:00',  // 基准日期（用于计算盈利和统计的开始时间）
    baseDateDisplay: '2025-11-02',           // 页面显示的日期格式

    // 应用配置
    appName: 'Trade Arena Xi',             // 跟踪代理名称
    appTitle: 'Trade Arena Xi',               // 页面标题

    // 刷新配置
    refreshInterval: 300,                     // 自动刷新间隔（秒）
    refreshButtonText: 'refresh',             // 刷新倒计时显示文本

    // 显示文本配置
    display: {
        dateTextPrefix: '',
        dateTextSuffix: ''
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