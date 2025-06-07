# CoinGecko API Server MCP - AWS 部署指南

本指南将帮助您将 CoinGecko API Server MCP 项目部署到 Amazon Web Services (AWS) 上。

## 📋 前提条件

### 1. AWS 账户和权限
- 拥有 AWS 账户
- 具有以下服务的权限：
  - Amazon ECS (Elastic Container Service)
  - Amazon ECR (Elastic Container Registry)
  - Amazon VPC
  - Amazon CloudWatch
  - IAM (Identity and Access Management)

### 2. 本地环境
- 安装 AWS CLI v2
- 安装 Docker
- 配置 AWS 凭证

## 🚀 快速部署

### 步骤 1: 配置 AWS 凭证

```bash
# 配置 AWS CLI
aws configure
```

输入您的：
- AWS Access Key ID
- AWS Secret Access Key
- Default region (推荐: us-west-2)
- Default output format (推荐: json)

### 步骤 2: 配置部署参数

```bash
# 复制配置文件模板
cp aws-config.env.example aws-config.env

# 编辑配置文件
vim aws-config.env  # 或使用您喜欢的编辑器
```

**必须配置的参数：**
- `AWS_ACCOUNT_ID`: 您的 AWS 账户 ID
- `AWS_REGION`: 部署区域
- `COINGECKO_API_KEY`: CoinGecko API 密钥（可选，用于提高 API 限制）

### 步骤 3: 执行部署

```bash
# 给脚本执行权限
chmod +x deploy-to-aws.sh
chmod +x cleanup-aws.sh

# 执行部署
./deploy-to-aws.sh
```

部署过程大约需要 5-10 分钟，脚本会自动：
1. 创建 ECR 仓库
2. 构建并推送 Docker 镜像
3. 创建 ECS 集群
4. 配置安全组
5. 创建任务定义
6. 启动 ECS 服务

### 步骤 4: 验证部署

部署完成后，脚本会显示服务的公网 IP 地址。您可以通过以下方式测试：

```bash
# 测试 ping 接口
curl http://YOUR_PUBLIC_IP:3000/api/ping

# 测试价格查询接口
curl "http://YOUR_PUBLIC_IP:3000/api/simple/price?ids=bitcoin&vs_currencies=usd"

# 测试 MCP JSON-RPC 接口
curl -X POST http://YOUR_PUBLIC_IP:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## 🔧 配置说明

### 资源配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| TASK_CPU | 256 | 任务 CPU 单位 (.25 vCPU) |
| TASK_MEMORY | 512 | 任务内存 MB (0.5 GB) |
| DESIRED_COUNT | 2 | 运行的任务实例数 |
| CONTAINER_PORT | 3000 | 容器端口 |

### 成本估算

基于默认配置的月度成本估算（us-west-2 区域）：

- **ECS Fargate**: ~$15-20/月
  - 2 个任务 × 0.25 vCPU × 0.5 GB 内存
- **ECR 存储**: ~$1/月
  - 存储 Docker 镜像
- **数据传输**: 根据使用量
- **CloudWatch 日志**: ~$1-2/月

**总计**: 约 $17-23/月

## 🔍 监控和日志

### CloudWatch 日志

```bash
# 查看实时日志
aws logs tail /ecs/coingecko-mcp-task --follow --region us-west-2
```

### ECS 服务状态

```bash
# 查看服务状态
aws ecs describe-services \
  --cluster coingecko-mcp-cluster \
  --services coingecko-mcp-service \
  --region us-west-2
```

### 任务状态

```bash
# 查看运行中的任务
aws ecs list-tasks \
  --cluster coingecko-mcp-cluster \
  --service-name coingecko-mcp-service \
  --region us-west-2
```

## 🔄 更新部署

当您更新代码后，重新运行部署脚本即可：

```bash
./deploy-to-aws.sh
```

脚本会：
1. 构建新的 Docker 镜像
2. 推送到 ECR
3. 更新 ECS 服务
4. 执行滚动更新

## 🗑️ 清理资源

当不再需要服务时，运行清理脚本删除所有 AWS 资源：

```bash
./cleanup-aws.sh
```

**警告**: 此操作将删除所有相关的 AWS 资源，包括：
- ECS 服务和集群
- ECR 仓库和镜像
- 安全组
- CloudWatch 日志组
- 任务定义

## 🛠️ 故障排除

### 常见问题

#### 1. 部署失败：权限不足

**错误**: `AccessDenied` 或权限相关错误

**解决方案**:
- 确保 AWS 用户具有必要的权限
- 检查 IAM 策略是否包含 ECS、ECR、VPC 权限

#### 2. Docker 构建失败

**错误**: Docker 构建过程中出错

**解决方案**:
- 确保 Docker 服务正在运行
- 检查 Dockerfile 语法
- 确保网络连接正常

#### 3. 服务无法启动

**错误**: ECS 任务启动失败

**解决方案**:
- 检查 CloudWatch 日志
- 验证环境变量配置
- 确保容器端口配置正确

#### 4. 无法访问服务

**错误**: 无法通过公网 IP 访问

**解决方案**:
- 检查安全组规则
- 确认任务正在运行
- 验证负载均衡器配置

### 调试命令

```bash
# 查看任务详情
aws ecs describe-tasks \
  --cluster coingecko-mcp-cluster \
  --tasks TASK_ARN \
  --region us-west-2

# 查看服务事件
aws ecs describe-services \
  --cluster coingecko-mcp-cluster \
  --services coingecko-mcp-service \
  --region us-west-2 \
  --query 'services[0].events'

# 查看最近的日志
aws logs get-log-events \
  --log-group-name /ecs/coingecko-mcp-task \
  --log-stream-name LOG_STREAM_NAME \
  --region us-west-2
```

## 🔐 安全最佳实践

1. **API 密钥管理**
   - 使用 AWS Secrets Manager 存储敏感信息
   - 定期轮换 API 密钥

2. **网络安全**
   - 限制安全组入站规则
   - 考虑使用 VPC 私有子网

3. **访问控制**
   - 使用 IAM 角色而非用户密钥
   - 遵循最小权限原则

4. **监控**
   - 启用 CloudTrail 审计
   - 设置 CloudWatch 告警

## 📞 支持

如果遇到问题，请：

1. 检查本指南的故障排除部分
2. 查看 CloudWatch 日志
3. 在项目 GitHub 仓库提交 Issue

## 📚 相关文档

- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [AWS ECR 文档](https://docs.aws.amazon.com/ecr/)
- [CoinGecko API 文档](https://www.coingecko.com/en/api/documentation)
- [MCP 协议规范](https://modelcontextprotocol.io/)

---

**注意**: 本指南假设您使用的是 AWS Fargate。如果需要使用 EC2 实例，请相应调整配置。