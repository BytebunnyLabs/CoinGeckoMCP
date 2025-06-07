# CoinGecko API Server MCP 使用教程

本教程将指导您如何在部署到 AWS 后使用 CoinGecko API Server MCP，特别是如何在 Claude 等 AI 助手中集成和使用这个 MCP 服务。

## 📋 目录

1. [MCP 简介](#mcp-简介)
2. [部署后的服务访问](#部署后的服务访问)
3. [在 Claude Desktop 中配置 MCP](#在-claude-desktop-中配置-mcp)
4. [MCP 可用方法](#mcp-可用方法)
5. [使用示例](#使用示例)
6. [故障排除](#故障排除)
7. [最佳实践](#最佳实践)

## 🔍 MCP 简介

Model Context Protocol (MCP) 是一个开放标准，允许 AI 助手安全地连接到外部数据源和工具。CoinGecko API Server MCP 为 AI 助手提供了访问实时加密货币数据的能力。

### 主要优势

- **实时数据**: 获取最新的加密货币价格和市场数据
- **标准化接口**: 通过 MCP 协议提供统一的访问方式
- **安全可靠**: 部署在您自己的 AWS 环境中
- **高性能**: 支持并发请求和缓存机制

## 🌐 部署后的服务访问

### 获取服务地址

部署完成后，您会得到一个公网 IP 地址，例如：`http://54.123.45.67:3000`

### 验证服务状态

```bash
# 测试基本连接
curl http://YOUR_PUBLIC_IP:3000/api/ping

# 测试 MCP schema
curl http://YOUR_PUBLIC_IP:3000/mcp/schema

# 测试 JSON-RPC 接口
curl -X POST http://YOUR_PUBLIC_IP:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## 🔧 在 Claude Desktop 中配置 MCP

### 步骤 1: 安装 Claude Desktop

如果还没有安装，请从 [Anthropic 官网](https://claude.ai/download) 下载并安装 Claude Desktop。

### 步骤 2: 配置 MCP 服务器

1. **找到配置文件位置**：
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **编辑配置文件**：

```json
{
  "mcpServers": {
    "coingecko-api": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-fetch",
        "http://YOUR_PUBLIC_IP:3000/rpc"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**重要**: 将 `YOUR_PUBLIC_IP` 替换为您的实际 AWS 服务公网 IP 地址。

### 步骤 3: 重启 Claude Desktop

保存配置文件后，完全退出并重新启动 Claude Desktop 应用程序。

### 步骤 4: 验证连接

在 Claude Desktop 中，您应该能看到 MCP 服务器连接状态。如果配置正确，会显示 "coingecko-api" 服务器已连接。

## 📚 MCP 可用方法

### 1. ping
**描述**: 测试服务连接状态
**参数**: 无
**返回**: 服务状态信息

### 2. getPrice
**描述**: 获取加密货币价格
**参数**:
- `ids` (string): 加密货币 ID，多个用逗号分隔
- `vs_currencies` (string): 目标货币，多个用逗号分隔
- `include_market_cap` (boolean, 可选): 是否包含市值
- `include_24hr_vol` (boolean, 可选): 是否包含24小时交易量
- `include_24hr_change` (boolean, 可选): 是否包含24小时价格变化

### 3. getSupportedVsCurrencies
**描述**: 获取支持的目标货币列表
**参数**: 无
**返回**: 支持的货币代码数组

### 4. getCoinMarkets
**描述**: 获取加密货币市场数据
**参数**:
- `vs_currency` (string): 目标货币
- `order` (string, 可选): 排序方式
- `per_page` (number, 可选): 每页数量
- `page` (number, 可选): 页码
- `sparkline` (boolean, 可选): 是否包含价格走势图数据

## 💡 使用示例

### 示例 1: 获取比特币价格

在 Claude Desktop 中，您可以这样询问：

```
请帮我查询比特币当前的美元价格
```

Claude 会自动调用 MCP 服务：

```json
{
  "method": "getPrice",
  "params": {
    "ids": "bitcoin",
    "vs_currencies": "usd",
    "include_24hr_change": true
  }
}
```

### 示例 2: 获取多种加密货币价格

```
请查询比特币、以太坊和狗狗币的美元和欧元价格，包括24小时涨跌幅
```

对应的 MCP 调用：

```json
{
  "method": "getPrice",
  "params": {
    "ids": "bitcoin,ethereum,dogecoin",
    "vs_currencies": "usd,eur",
    "include_24hr_change": true,
    "include_market_cap": true
  }
}
```

### 示例 3: 获取市场排行榜

```
请显示市值排名前10的加密货币
```

对应的 MCP 调用：

```json
{
  "method": "getCoinMarkets",
  "params": {
    "vs_currency": "usd",
    "order": "market_cap_desc",
    "per_page": 10,
    "page": 1
  }
}
```

### 示例 4: 复杂查询

```
请分析比特币和以太坊的价格趋势，包括：
1. 当前价格（美元和人民币）
2. 24小时涨跌幅
3. 市值排名
4. 24小时交易量
```

Claude 会自动组合多个 MCP 调用来获取所需数据。

## 🔧 故障排除

### 常见问题

#### 1. MCP 服务器连接失败

**症状**: Claude Desktop 显示 MCP 服务器离线

**解决方案**:
- 检查 AWS 服务是否正在运行
- 验证公网 IP 地址是否正确
- 确认安全组允许 3000 端口访问
- 检查配置文件语法是否正确

#### 2. 请求超时

**症状**: MCP 调用响应缓慢或超时

**解决方案**:
- 检查网络连接
- 验证 AWS 服务健康状态
- 查看 CloudWatch 日志
- 考虑增加 ECS 任务实例数

#### 3. API 限制错误

**症状**: 返回 429 错误或 API 限制提示

**解决方案**:
- 配置 CoinGecko Pro API 密钥
- 减少请求频率
- 实现客户端缓存

### 调试命令

```bash
# 检查服务状态
curl -v http://YOUR_PUBLIC_IP:3000/api/ping

# 测试 JSON-RPC 接口
curl -X POST http://YOUR_PUBLIC_IP:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}' \
  -v

# 查看 AWS 日志
aws logs tail /ecs/coingecko-mcp-task --follow --region us-west-2
```

## 🎯 最佳实践

### 1. 性能优化

- **缓存策略**: 对于不经常变化的数据（如支持的货币列表），实现客户端缓存
- **批量请求**: 尽可能在单个请求中获取多种货币的数据
- **合理频率**: 避免过于频繁的价格查询

### 2. 错误处理

- **重试机制**: 实现指数退避重试
- **降级策略**: 在服务不可用时提供缓存数据
- **监控告警**: 设置 CloudWatch 告警监控服务健康状态

### 3. 安全考虑

- **访问控制**: 考虑添加 API 密钥认证
- **网络安全**: 使用 VPC 和安全组限制访问
- **日志审计**: 启用详细的访问日志

### 4. 成本优化

- **自动扩展**: 根据负载自动调整实例数量
- **定时任务**: 在低峰期减少实例数量
- **监控成本**: 定期检查 AWS 账单

## 📊 使用场景示例

### 投资分析助手

```
作为我的加密货币投资顾问，请分析以下币种的投资价值：
- 比特币 (BTC)
- 以太坊 (ETH)
- 币安币 (BNB)
- 卡尔达诺 (ADA)

请提供：
1. 当前价格和24小时变化
2. 市值排名
3. 交易量分析
4. 投资建议
```

### 市场监控

```
请帮我监控以下加密货币，如果价格变化超过5%请提醒我：
- 比特币
- 以太坊
- 狗狗币
```

### 套利机会分析

```
请比较以下加密货币在不同法币中的价格差异，寻找套利机会：
- 比特币：美元 vs 欧元 vs 日元
- 以太坊：美元 vs 英镑 vs 瑞士法郎
```

## 🔗 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [CoinGecko API 文档](https://www.coingecko.com/en/api/documentation)
- [Claude Desktop 下载](https://claude.ai/download)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)

## 📞 技术支持

如果遇到问题，请：

1. 查看本教程的故障排除部分
2. 检查 AWS CloudWatch 日志
3. 在项目 GitHub 仓库提交 Issue
4. 联系技术支持团队

---

**注意**: 本教程假设您已经成功部署了 CoinGecko API Server MCP 到 AWS。如果还没有部署，请先参考 <mcfile name="AWS-部署指南.md" path="/Users/gz/Documents/GitHub/CoinGeckoMCP/AWS-部署指南.md"></mcfile>。