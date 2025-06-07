#!/bin/bash

# CoinGecko API Server MCP - AWS 部署脚本
# 此脚本将项目部署到 AWS ECS 上

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
AWS_REGION="us-west-2"  # 修改为你的AWS区域
ECR_REPOSITORY="coingecko-api-server-mcp"
CLUSTER_NAME="coingecko-mcp-cluster"
SERVICE_NAME="coingecko-mcp-service"
TASK_DEFINITION_NAME="coingecko-mcp-task"
CONTAINER_NAME="coingecko-mcp-container"
CONTAINER_PORT=3000
DESIRED_COUNT=2

# 从环境变量或提示获取配置
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}请设置 AWS_ACCOUNT_ID 环境变量或输入你的 AWS 账户 ID:${NC}"
    read -p "AWS Account ID: " AWS_ACCOUNT_ID
fi

if [ -z "$COINGECKO_API_KEY" ]; then
    echo -e "${YELLOW}请设置 COINGECKO_API_KEY 环境变量 (可选，用于 Pro API):${NC}"
    read -p "CoinGecko API Key (可选): " COINGECKO_API_KEY
fi

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_prerequisites() {
    log_info "检查必要的工具..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI 未安装。请安装 AWS CLI。"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装。请安装 Docker。"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq 未安装。请安装 jq。"
        exit 1
    fi
    
    log_success "所有必要工具已安装"
}

# 检查 AWS 凭证
check_aws_credentials() {
    log_info "检查 AWS 凭证..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 凭证未配置。请运行 'aws configure' 配置凭证。"
        exit 1
    fi
    
    log_success "AWS 凭证验证成功"
}

# 创建 ECR 仓库
create_ecr_repository() {
    log_info "创建 ECR 仓库..."
    
    if aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
        log_warning "ECR 仓库 $ECR_REPOSITORY 已存在"
    else
        aws ecr create-repository \
            --repository-name $ECR_REPOSITORY \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true
        log_success "ECR 仓库创建成功"
    fi
}

# 构建和推送 Docker 镜像
build_and_push_image() {
    log_info "构建和推送 Docker 镜像..."
    
    # 登录到 ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # 构建镜像
    cd CG-MCP
    docker build -t $ECR_REPOSITORY:latest .
    
    # 标记镜像
    docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    # 推送镜像
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    cd ..
    log_success "Docker 镜像推送成功"
}

# 创建 ECS 集群
create_ecs_cluster() {
    log_info "创建 ECS 集群..."
    
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        log_warning "ECS 集群 $CLUSTER_NAME 已存在"
    else
        aws ecs create-cluster \
            --cluster-name $CLUSTER_NAME \
            --capacity-providers FARGATE \
            --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
            --region $AWS_REGION
        log_success "ECS 集群创建成功"
    fi
}

# 创建任务定义
create_task_definition() {
    log_info "创建 ECS 任务定义..."
    
    # 创建任务定义 JSON
    cat > task-definition.json << EOF
{
    "family": "$TASK_DEFINITION_NAME",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "$CONTAINER_NAME",
            "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest",
            "portMappings": [
                {
                    "containerPort": $CONTAINER_PORT,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "PORT",
                    "value": "$CONTAINER_PORT"
                },
                {
                    "name": "NODE_ENV",
                    "value": "production"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/$TASK_DEFINITION_NAME",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "essential": true
        }
    ]
}
EOF

    # 如果有 API Key，添加到环境变量
    if [ ! -z "$COINGECKO_API_KEY" ]; then
        jq '.containerDefinitions[0].environment += [{"name": "COINGECKO_API_KEY", "value": "'$COINGECKO_API_KEY'"}]' task-definition.json > task-definition-temp.json
        mv task-definition-temp.json task-definition.json
    fi
    
    # 注册任务定义
    aws ecs register-task-definition \
        --cli-input-json file://task-definition.json \
        --region $AWS_REGION
    
    rm task-definition.json
    log_success "任务定义创建成功"
}

# 创建 CloudWatch 日志组
create_log_group() {
    log_info "创建 CloudWatch 日志组..."
    
    if aws logs describe-log-groups --log-group-name-prefix "/ecs/$TASK_DEFINITION_NAME" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "/ecs/$TASK_DEFINITION_NAME"; then
        log_warning "日志组已存在"
    else
        aws logs create-log-group \
            --log-group-name "/ecs/$TASK_DEFINITION_NAME" \
            --region $AWS_REGION
        log_success "CloudWatch 日志组创建成功"
    fi
}

# 创建安全组
create_security_group() {
    log_info "创建安全组..."
    
    # 获取默认 VPC ID
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
    
    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        log_error "未找到默认 VPC。请手动创建 VPC 和安全组。"
        exit 1
    fi
    
    # 检查安全组是否存在
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=coingecko-mcp-sg" "Name=vpc-id,Values=$VPC_ID" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)
    
    if [ "$SECURITY_GROUP_ID" != "None" ] && [ ! -z "$SECURITY_GROUP_ID" ]; then
        log_warning "安全组已存在: $SECURITY_GROUP_ID"
    else
        # 创建安全组
        SECURITY_GROUP_ID=$(aws ec2 create-security-group \
            --group-name coingecko-mcp-sg \
            --description "Security group for CoinGecko MCP service" \
            --vpc-id $VPC_ID \
            --region $AWS_REGION \
            --query 'GroupId' \
            --output text)
        
        # 添加入站规则
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp \
            --port $CONTAINER_PORT \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        log_success "安全组创建成功: $SECURITY_GROUP_ID"
    fi
    
    echo $SECURITY_GROUP_ID
}

# 创建 ECS 服务
create_ecs_service() {
    log_info "创建 ECS 服务..."
    
    # 获取安全组 ID
    SECURITY_GROUP_ID=$(create_security_group)
    
    # 获取子网 ID
    SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=default-for-az,Values=true" \
        --query 'Subnets[*].SubnetId' \
        --output text \
        --region $AWS_REGION)
    
    if [ -z "$SUBNET_IDS" ]; then
        log_error "未找到默认子网。请手动配置网络。"
        exit 1
    fi
    
    # 转换子网 ID 为数组格式
    SUBNET_ARRAY=$(echo $SUBNET_IDS | tr ' ' ',' | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')
    
    # 检查服务是否存在
    if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        log_warning "ECS 服务 $SERVICE_NAME 已存在，正在更新..."
        
        # 更新服务
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --task-definition $TASK_DEFINITION_NAME \
            --desired-count $DESIRED_COUNT \
            --region $AWS_REGION
    else
        # 创建服务
        aws ecs create-service \
            --cluster $CLUSTER_NAME \
            --service-name $SERVICE_NAME \
            --task-definition $TASK_DEFINITION_NAME \
            --desired-count $DESIRED_COUNT \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ARRAY],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
            --region $AWS_REGION
    fi
    
    log_success "ECS 服务创建/更新成功"
}

# 等待服务稳定
wait_for_service() {
    log_info "等待服务稳定..."
    
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $AWS_REGION
    
    log_success "服务已稳定运行"
}

# 获取服务信息
get_service_info() {
    log_info "获取服务信息..."
    
    # 获取任务 ARN
    TASK_ARN=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --region $AWS_REGION \
        --query 'taskArns[0]' \
        --output text)
    
    if [ "$TASK_ARN" != "None" ] && [ ! -z "$TASK_ARN" ]; then
        # 获取任务详情
        PUBLIC_IP=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks $TASK_ARN \
            --region $AWS_REGION \
            --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
            --output text | xargs -I {} aws ec2 describe-network-interfaces \
            --network-interface-ids {} \
            --region $AWS_REGION \
            --query 'NetworkInterfaces[0].Association.PublicIp' \
            --output text)
        
        if [ "$PUBLIC_IP" != "None" ] && [ ! -z "$PUBLIC_IP" ]; then
            echo -e "\n${GREEN}=== 部署成功! ===${NC}"
            echo -e "${BLUE}服务 URL:${NC} http://$PUBLIC_IP:$CONTAINER_PORT"
            echo -e "${BLUE}健康检查:${NC} http://$PUBLIC_IP:$CONTAINER_PORT/"
            echo -e "${BLUE}MCP Schema:${NC} http://$PUBLIC_IP:$CONTAINER_PORT/mcp/schema"
            echo -e "${BLUE}JSON-RPC 端点:${NC} http://$PUBLIC_IP:$CONTAINER_PORT/rpc"
        else
            log_warning "无法获取公共 IP 地址"
        fi
    else
        log_warning "无法获取任务信息"
    fi
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    rm -f task-definition.json
}

# 主函数
main() {
    echo -e "${BLUE}=== CoinGecko API Server MCP - AWS 部署脚本 ===${NC}\n"
    
    # 设置清理陷阱
    trap cleanup EXIT
    
    # 执行部署步骤
    check_prerequisites
    check_aws_credentials
    create_ecr_repository
    build_and_push_image
    create_ecs_cluster
    create_log_group
    create_task_definition
    create_ecs_service
    wait_for_service
    get_service_info
    
    echo -e "\n${GREEN}=== 部署完成! ===${NC}"
    echo -e "${YELLOW}注意: 请确保在 AWS 控制台中配置适当的 IAM 角色和权限。${NC}"
    echo -e "${YELLOW}如需删除资源，请运行: ./cleanup-aws.sh${NC}"
}

# 运行主函数
main "$@"