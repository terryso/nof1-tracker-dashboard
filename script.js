// 后端API客户端类
class BackendAPIClient {
    constructor() {
        this.baseUrl = ''; // 相对路径，调用同域名下的API
    }

    // 获取账户信息
    async getAccountInfo() {
        try {
            const response = await fetch('/api/account');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取账户信息失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取账户信息失败:', error);
            throw error;
        }
    }

    // 获取持仓信息
    async getPositions() {
        try {
            const response = await fetch('/api/positions');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取仓位信息失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取仓位信息失败:', error);
            throw error;
        }
    }

    // 获取用户交易记录
    async getUserTrades(limit = 25) {
        try {
            const response = await fetch(`/api/trades?limit=${limit}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取交易记录失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取交易记录失败:', error);
            throw error;
        }
    }

    // 检查API配置
    async checkConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('检查配置失败');
            }
            return await response.json();
        } catch (error) {
            console.error('检查配置失败:', error);
            throw error;
        }
    }
}

// 数据管理器
// 格式化持仓数量显示
function formatPositionAmount(amount) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
        return absAmount.toFixed(0);
    } else if (absAmount >= 1) {
        return absAmount.toFixed(2);
    } else {
        return absAmount.toFixed(4);
    }
}
class DataManager {
    constructor() {
        this.apiClient = new BackendAPIClient();
        this.data = {
            account: null,
            positions: [],
            trades: []
        };
        this.lastUpdate = null;
        this.updateCallbacks = [];
        this.baseAssetValue = 140; // 基础资产价值 (USDT)
        this.baseDate = new Date('2025-10-25T00:00:00+08:00'); // 基准日期
    }

    // 注册数据更新回调
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    // 通知数据更新
    notifyUpdate(type, data) {
        this.updateCallbacks.forEach(callback => callback(type, data));
    }

    // 获取基础资产价值
    getBaseAssetValue() {
        // 2025年10月25日的初始钱包余额：140 USDT
        // 这是基于用户提供的真实历史数据
        return this.baseAssetValue;
    }

    // 获取基准日期
    getBaseDate() {
        return this.baseDate;
    }

    // 更新所有数据
    async updateAllData() {
        try {
            console.log('开始更新数据...');

            // 并行获取所有数据
            const [accountData, positionsData, tradesData] = await Promise.all([
                this.apiClient.getAccountInfo(),
                this.apiClient.getPositions(),
                this.apiClient.getUserTrades(25)
            ]);

            // 更新数据
            this.data.account = accountData;
            this.data.positions = positionsData;
            this.data.trades = tradesData;
            this.lastUpdate = new Date();

            // 计算并添加盈亏分析
            this.calculateProfitMetrics();

            // 通知更新
            this.notifyUpdate('all', this.data);

            console.log('数据更新完成');
            return true;

        } catch (error) {
            console.error('数据更新失败:', error);
            this.notifyUpdate('error', error);
            return false;
        }
    }

    // 计算盈亏指标
    calculateProfitMetrics() {
        if (!this.data.account) return;

        const account = this.data.account;
        const totalWalletBalance = parseFloat(account.totalWalletBalance);

        // 计算总盈利
        const totalProfit = totalWalletBalance - this.getBaseAssetValue();

        // 计算总盈利率
        const totalProfitRate = (totalProfit / this.getBaseAssetValue()) * 100;

        // 计算未实现盈亏
        const totalUnrealizedPnl = parseFloat(account.totalUnrealizedProfit);

        // 计算未实现盈亏率
        const unrealizedPnlRate = totalWalletBalance > 0
            ? (totalUnrealizedPnl / (totalWalletBalance - totalUnrealizedPnl)) * 100
            : 0;

        // 调试日志
        console.log('盈亏计算:', {
            totalWalletBalance: totalWalletBalance.toFixed(2),
            baseAssetValue: this.getBaseAssetValue(),
            totalProfit: totalProfit.toFixed(2),
            totalProfitRate: totalProfitRate.toFixed(2) + '%',
            totalUnrealizedPnl: totalUnrealizedPnl.toFixed(2),
            unrealizedPnlRate: unrealizedPnlRate.toFixed(2) + '%'
        });

        // 添加到账户数据中
        this.data.account.totalProfit = totalProfit;
        this.data.account.totalProfitRate = totalProfitRate;
        this.data.account.unrealizedPnlRate = unrealizedPnlRate;

        // 计算最大盈利和最大损失
        this.calculateMaxProfitLoss();
    }

    // 计算最大盈利和最大损失
    calculateMaxProfitLoss() {
        if (!this.data.trades || this.data.trades.length === 0) return;

        const baseDate = this.getBaseDate();
        let maxProfit = 0;
        let maxLoss = 0;
        let totalRealizedPnl = 0;

        // 分析每笔交易的已实现盈亏
        this.data.trades.forEach(trade => {
            const tradeDate = new Date(trade.time);

            // 只分析基准日期之后的交易
            if (tradeDate >= baseDate) {
                // 使用币安API返回的实际已实现盈亏
                const realizedPnl = trade.realizedPnl ? parseFloat(trade.realizedPnl) : 0;
                
                // 累计总已实现盈亏
                totalRealizedPnl += realizedPnl;
                
                // 更新最大盈利和最大损失
                if (realizedPnl > maxProfit) {
                    maxProfit = realizedPnl;
                }
                if (realizedPnl < maxLoss) {
                    maxLoss = realizedPnl;
                }
            }
        });

        // 添加到账户数据中
        this.data.account.maxProfit = maxProfit;
        this.data.account.maxLoss = maxLoss;
        this.data.account.totalRealizedPnl = totalRealizedPnl;
    }

    // 获取当前数据
    getData() {
        return this.data;
    }

    // 获取上次更新时间
    getLastUpdate() {
        return this.lastUpdate;
    }
}

// UI管理器
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.refreshInterval = 60; // 60秒刷新间隔
        this.countdown = 60;
        this.autoRefreshTimer = null;
        this.countdownTimer = null;
        this.isLoading = false;

        this.initializeEventListeners();
        this.startAutoRefresh();
        this.registerDataCallbacks();
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 手动刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.manualRefresh());
        }
    }

    // 注册数据回调
    registerDataCallbacks() {
        this.dataManager.onUpdate((type, data) => {
            if (type === 'all') {
                this.updateUI(data);
            } else if (type === 'error') {
                this.showError(data);
            }
        });
    }

    // 开始自动刷新
    startAutoRefresh() {
        this.countdown = this.refreshInterval;
        this.updateCountdownDisplay();

        // 设置倒计时定时器
        this.countdownTimer = setInterval(() => {
            this.countdown--;
            this.updateCountdownDisplay();

            if (this.countdown <= 0) {
                this.autoRefresh();
            }
        }, 1000);

        // 立即执行一次刷新
        this.autoRefresh();
    }

    // 自动刷新
    async autoRefresh() {
        if (this.isLoading) return;

        console.log('自动刷新数据...');
        await this.refreshData();
        this.countdown = this.refreshInterval;
    }

    // 手动刷新
    async manualRefresh() {
        if (this.isLoading) return;

        console.log('手动刷新数据...');
        await this.refreshData();
        this.countdown = this.refreshInterval;
    }

    // 刷新数据
    async refreshData() {
        if (this.isLoading) return;

        this.setLoading(true);

        try {
            const success = await this.dataManager.updateAllData();
            if (success) {
                this.updateStatus('online', '已连接');
            } else {
                this.updateStatus('error', '数据更新失败');
            }
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.updateStatus('error', '连接失败');
        } finally {
            this.setLoading(false);
        }
    }

    // 设置加载状态
    setLoading(loading) {
        this.isLoading = loading;

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            if (loading) {
                refreshBtn.classList.add('loading');
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            } else {
                refreshBtn.classList.remove('loading');
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }
    }

    // 更新倒计时显示
    updateCountdownDisplay() {
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.textContent = `下次刷新: ${this.countdown}秒`;
        }
    }

    // 更新连接状态
    updateStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }

        if (statusText) {
            statusText.textContent = text;
        }
    }

    // 更新UI
    updateUI(data) {
        this.updateAccountOverview(data.account);
        this.updatePositionsTable(data.positions, data.account);
        this.updateTradesTable(data.trades);
        this.updateLastUpdateTime();
    }

    // 更新账户概览
    updateAccountOverview(account) {
        if (!account) return;

        // 总资产
        this.updateElement('totalAssets', parseFloat(account.totalWalletBalance).toFixed(2));

        // 总盈利
        const totalProfit = account.totalProfit || 0;
        this.updateElement('totalProfit', totalProfit.toFixed(2), totalProfit >= 0);

        // 总盈利率
        const totalProfitRate = account.totalProfitRate || 0;
        this.updateElement('totalProfitRate', `${totalProfitRate.toFixed(2)}%`, totalProfitRate >= 0);

        // 未实现盈亏
        const totalUnrealizedPnl = parseFloat(account.totalUnrealizedProfit);
        this.updateElement('totalUnrealizedPnl', totalUnrealizedPnl.toFixed(2), totalUnrealizedPnl >= 0);

        // 未实现盈亏率
        const unrealizedPnlRate = account.unrealizedPnlRate || 0;
        this.updateElement('unrealizedPnlRate', `${unrealizedPnlRate.toFixed(2)}%`, unrealizedPnlRate >= 0);

        // 最大盈利和最大损失
        const maxProfit = account.maxProfit || 0;
        const maxLoss = account.maxLoss || 0;
        this.updateElement('maxProfit', maxProfit.toFixed(2));
        this.updateElement('maxLoss', Math.abs(maxLoss).toFixed(2));
    }

    // 更新仓位表格
    updatePositionsTable(positions, accountInfo) {
        // 获取账户信息用于保证金计算
        const totalMargin = accountInfo ? (accountInfo.totalPositionInitialMargin || accountInfo.totalInitialMargin || 0) : 0;
        const tbody = document.getElementById('positionsTableBody');
        if (!tbody) return;

        if (!positions || positions.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="8">暂无持仓数据</td>
                </tr>
            `;
            return;
        }
        
        // 过滤出有实际持仓的记录（positionAmt != 0）
        const activePositions = positions.filter(position => {
            const posAmt = parseFloat(position.positionAmt);
            return posAmt !== 0;
        });
        
        if (!activePositions || activePositions.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="8">暂无持仓数据</td>
                </tr>
            `;
            return;
        }
        
        const rows = activePositions.map(position => {
            const posAmt = parseFloat(position.positionAmt);
            const entryPrice = parseFloat(position.entryPrice);
            const markPrice = parseFloat(position.markPrice);
            const unrealizedPnl = parseFloat(position.unRealizedProfit);
            const pnlRate = ((markPrice - entryPrice) / entryPrice * posAmt > 0 ? 1 : -1) *
                           (Math.abs(unrealizedPnl) / (Math.abs(posAmt) * entryPrice)) * 100;
            
            // 计算保证金：对于全仓模式，使用 notional / leverage；对于逐仓模式，使用 isolatedMargin
            let margin;
            if (position.marginType === 'cross') {
                // 全仓模式：保证金 = 名义价值 / 杠杆倍数
                const notional = Math.abs(parseFloat(position.notional));
                const leverage = parseFloat(position.leverage);
                margin = notional / leverage;
            } else {
                // 逐仓模式：直接使用 isolatedMargin
                margin = parseFloat(position.isolatedMargin);
            }

            return `
                <tr>
                    <td>${position.symbol}</td>
                    <td><span class="direction-tag ${posAmt > 0 ? 'direction-long' : 'direction-short'}">${posAmt > 0 ? 'LONG' : 'SHORT'}</span></td>
                    <td>${entryPrice.toFixed(4)}</td>
                    <td>${markPrice.toFixed(4)}</td>
                    <td>${formatPositionAmount(posAmt)}</td>
                    <td class="${unrealizedPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">${unrealizedPnl.toFixed(2)}</td>
                    <td class="${pnlRate >= 0 ? 'pnl-positive' : 'pnl-negative'}">${pnlRate.toFixed(2)}%</td>
                    <td>${margin.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
        
        // 更新持仓数量显示
        const positionCountElement = document.getElementById('positionCount');
        if (positionCountElement) {
            positionCountElement.textContent = activePositions.length;
        }
    }

    // 更新交易表格
    updateTradesTable(trades) {
        const tbody = document.getElementById('tradesTableBody');
        if (!tbody) return;

        if (!trades || trades.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="8">暂无交易数据</td>
                </tr>
            `;
            return;
        }

        const rows = trades.slice(0, 25).map(trade => {
            const time = new Date(trade.time);
            const timeStr = time.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <tr>
                    <td class="time-cell">${timeStr}</td>
                    <td>${trade.symbol}</td>
                    <td><span class="direction-tag ${trade.side === 'BUY' ? 'direction-buy' : 'direction-sell'}">${trade.side}</span></td>
                    <td>${parseFloat(trade.price).toFixed(4)}</td>
                    <td>${parseFloat(trade.qty).toFixed(3)}</td>
                    <td>${(parseFloat(trade.qty) * parseFloat(trade.price)).toFixed(2)}</td>
                    <td>${parseFloat(trade.commission).toFixed(4)} ${trade.commissionAsset}</td>
                    <td>${trade.realizedPnl ? parseFloat(trade.realizedPnl).toFixed(2) : '-'}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    // 更新最后更新时间
    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        const lastUpdate = this.dataManager.getLastUpdate();

        if (lastUpdateElement && lastUpdate) {
            lastUpdateElement.textContent = `最后更新: ${lastUpdate.toLocaleTimeString('zh-CN')}`;
        }
    }

    // 更新元素内容
    updateElement(id, value, isPositive = null) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;

            // 移除现有的正负值类
            element.classList.remove('positive', 'negative');

            // 如果指定了正负值，添加对应的类
            if (isPositive !== null) {
                element.classList.add(isPositive ? 'positive' : 'negative');
            }
        }
    }

    // 显示错误信息
    showError(error) {
        console.error('UI错误:', error);
        // 可以在这里添加错误提示的UI逻辑
    }

    // 销毁
    destroy() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，初始化应用...');

    // 检查API配置
    try {
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();

        if (!config.hasConfig) {
            console.error('后端API密钥未配置，请联系管理员');
            alert('后端API密钥未配置，请联系管理员配置币安API密钥');
            return;
        }

        // 初始化数据管理器
        const dataManager = new DataManager();

        // 初始化UI管理器
        const uiManager = new UIManager(dataManager);

        // 全局错误处理
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason);
        });

        console.log('应用初始化完成');

    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('应用初始化失败，请检查网络连接和后端服务状态');
    }
});