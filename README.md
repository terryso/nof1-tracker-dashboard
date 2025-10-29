# Nof1 Tracker Dashboard

一个安全的币安合约交易数据监控面板，采用前后端分离架构，保护API密钥安全。

## 功能特性

- 🔒 **安全架构**: API密钥仅存储在服务器端，前端无法访问
- 📊 **实时数据**: 60秒自动刷新，显示最新的账户和交易数据
- 💰 **盈亏分析**: 自定义基准日期，计算总盈利、盈利率等关键指标
- ⚙️ **灵活配置**: 独立配置文件，轻松调整初始资金和跟单日期
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **高性能**: 使用Render云平台,稳定可靠
- 🎯 **专注合约**: 只显示期货合约相关数据，过滤现货交易

## 数据展示

### 1. 账户总资产
- 总资产折合 (USDT)
- 总盈利 (自2025-10-25以来)
- 总盈利率 (自2025-10-25以来)
- 未实现盈亏
- 未实现盈亏率
- 最大盈利 / 最大损失 (自2025-10-25以来)

### 2. 当前仓位
- 币种
- 方向 (LONG/SHORT)
- 开仓价格
- 标记价格
- 持仓量
- 未实现盈亏
- 收益率
- 保证金

### 3. 最近交易记录
- 最近25笔合约交易
- 成交价格、数量、金额
- 手续费
- 交易时间

## 技术架构

### 后端 (Render Web Service)
- **Node.js** + **Express** 框架
- 币安合约API集成
- HMAC-SHA256签名验证
- CORS支持
- 环境变量管理

### 前端
- **原生JavaScript** (ES6+)
- **CSS Grid** + **Flexbox** 响应式布局
- **Font Awesome** 图标
- 60秒自动刷新机制

### 部署平台
- **Render** (Web Service)

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd nof1-tracker-dashboard
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置币安API

1. 登录币安账户,创建只读权限的API密钥
2. 创建 `.env` 文件(参考 `.env.example`):
   - `BINANCE_API_KEY`: 你的币安API Key
   - `BINANCE_SECRET_KEY`: 你的币安Secret Key
   - `USE_TESTNET`: `false` (主网) 或 `true` (测试网)

### 4. 本地开发

```bash
# 启动开发服务器
npm start
```

访问 `http://localhost:3000` 查看应用。

### 5. 部署到Render

1. 在 [Render](https://render.com) 创建账户
2. 连接你的 GitHub 仓库
3. 创建新的 Web Service
4. 配置构建和启动命令:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 在 Environment 中添加环境变量
6. 点击 Deploy

或直接通过 Render GitHub 集成自动部署。

## 环境变量配置

在 Render 项目的 Environment 设置中添加以下环境变量:

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `BINANCE_API_KEY` | 币安API Key | `XAbc123...` |
| `BINANCE_SECRET_KEY` | 币安Secret Key | `s3cr3tK3y...` |
| `USE_TESTNET` | 是否使用测试网络 | `false` |

## API端点

- `GET /api/account` - 获取账户信息
- `GET /api/positions` - 获取当前仓位
- `GET /api/trades?limit=25` - 获取交易记录
- `GET /api/config` - 检查API配置状态

## 安全说明

✅ **安全措施**:
- API密钥仅存储在服务器端环境变量
- 使用只读权限API密钥
- 前端无法访问敏感信息
- HTTPS加密传输

⚠️ **注意事项**:
- 请确保API密钥只有只读权限
- 定期轮换API密钥
- 监控API使用情况
- 不要在代码中提交密钥

## 自定义配置

### ⚙️ 交易配置

项目使用独立的配置文件 `trading-config.js` 来管理交易参数。修改配置后需要重启服务器生效。

**配置文件位置：** `trading-config.js`

```javascript
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
```

**配置说明：**

| 参数 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `initialAssetValue` | Number | 初始资金金额，用于计算总盈利 | 140 |
| `baseDate` | String | 跟单开始时间，用于筛选交易记录 | '2025-10-25T00:00:00+08:00' |
| `baseDateDisplay` | String | 页面显示的日期格式 | '2025-10-25' |

**使用步骤：**

1. 编辑 `trading-config.js` 文件
2. 修改相应的配置值
3. 重启服务器：`npm start`

### 修改刷新间隔

在 `script.js` 中修改：

```javascript
// 刷新间隔 (秒)
this.refreshInterval = 60;
```

## 故障排除

### 常见问题

1. **"后端API密钥未配置"错误**
   - 检查 Render 环境变量是否正确设置
   - 确认API密钥格式正确

2. **"数据更新失败"错误**
   - 检查网络连接
   - 验证币安API服务状态
   - 确认API密钥权限正确

3. **页面无法加载**
   - 检查 Render 部署状态和日志
   - 验证服务是否正常运行

4. **配置修改后未生效**
   - 确认已修改 `trading-config.js` 文件
   - 重启服务器：`npm start`
   - 检查浏览器缓存，尝试强制刷新（Ctrl+F5）

5. **盈利计算不正确**
   - 检查 `initialAssetValue` 是否设置正确
   - 确认 `baseDate` 设置为正确的跟单开始日期
   - 验证币安交易记录是否包含指定日期后的数据

### 调试模式

打开浏览器开发者工具查看控制台日志：

```javascript
// 查看详细API调用日志
console.log('API请求:', request);
console.log('API响应:', response);
```

## 项目结构

```
nof1-tracker-dashboard/
├── api/                     # API路由
│   ├── account.js          # 账户信息API
│   ├── positions.js        # 仓位信息API
│   ├── trades.js           # 交易记录API
│   └── config.js           # 配置检查API
├── binance-tracker.html    # 主页面
├── styles.css              # 样式文件
├── script.js               # 前端JavaScript
├── trading-config.js       # 交易配置文件 ⭐
├── server.js               # Express服务器
├── package.json            # 项目配置
├── .env.example            # 环境变量示例
├── .gitignore              # Git忽略文件
└── README.md               # 项目文档
```

**⭐ 新增文件：**
- `trading-config.js` - 交易参数配置文件，用于设置初始资金和跟单日期

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请：
- 创建 [Issue](../../issues)
- 联系开发团队

---
