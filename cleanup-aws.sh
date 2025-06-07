#!/bin/bash

# CoinGecko API Server MCP - AWS 资源清理脚本
# 此脚本将删除部署到 AWS 的所有资源

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
SECURITY_GROUP_NAME="coingecko-mcp-sg"
LOG_GROUP_NAME="/ecs/$TASK_DEFINITION_NAME"

# 从环境变量或提示获取配置
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}请设置 AWS_ACCOUNT_ID 环境变量或输入你的 AWS 账户 ID:${NC}"
    read -p "AWS Account ID: " AWS_ACCOUNT_ID
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

# 确认删除
confirm_deletion() {
    echo -e "${RED}警告: 此操作将删除以下 AWS 资源:${NC}"
    echo "  - ECS 服务: $SERVICE_NAME"
    echo "  - ECS 集群: $CLUSTER_NAME"
    echo "  - ECR 仓库: $ECR_REPOSITORY (包括所有镜像)"
    echo "  - 安全组: $SECURITY_GROUP_NAME"
    echo "  - CloudWatch 日志组: $LOG_GROUP_NAME"
    echo "  - 任务定义: $TASK_DEFINITION_NAME (所有版本)"
    echo ""
    read -p "确定要继续吗? (输入 'yes' 确认): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
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

# 删除 ECS 服务
delete_ecs_service() {
    log_info "删除 ECS 服务..."
    
    if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        # 将服务的期望任务数设置为 0
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --desired-count 0 \
            --region $AWS_REGION > /dev/null
        
        log_info "等待服务任务停止..."
        aws ecs wait services-stable \
            --cluster $CLUSTER_NAME \
            --services $SERVICE_NAME \
            --region $AWS_REGION
        
        # 删除服务
        aws ecs delete-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --region $AWS_REGION > /dev/null
        
        log_success "ECS 服务删除成功"
    else
        log_warning "ECS 服务不存在或已删除"
    fi
}

# 删除 ECS 集群
delete_ecs_cluster() {
    log_info "删除 ECS 集群..."
    
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        aws ecs delete-cluster \
            --cluster $CLUSTER_NAME \
            --region $AWS_REGION > /dev/null
        
        log_success "ECS 集群删除成功"
    else
        log_warning "ECS 集群不存在或已删除"
    fi
}

# 删除任务定义
delete_task_definitions() {
    log_info "删除任务定义..."
    
    # 获取所有任务定义版本
    TASK_DEFINITION_ARNS=$(aws ecs list-task-definitions \
        --family-prefix $TASK_DEFINITION_NAME \
        --region $AWS_REGION \
        --query 'taskDefinitionArns[]' \
        --output text 2>/dev/null)
    
    if [ ! -z "$TASK_DEFINITION_ARNS" ]; then
        for arn in $TASK_DEFINITION_ARNS; do
            aws ecs deregister-task-definition \
                --task-definition $arn \
                --region $AWS_REGION > /dev/null
        done
        log_success "任务定义删除成功"
    else
        log_warning "未找到任务定义"
    fi
}

# 删除 ECR 仓库
delete_ecr_repository() {
    log_info "删除 ECR 仓库..."
    
    if aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
        aws ecr delete-repository \
            --repository-name $ECR_REPOSITORY \
            --force \
            --region $AWS_REGION > /dev/null
        
        log_success "ECR 仓库删除成功"
    else
        log_warning "ECR 仓库不存在或已删除"
    fi
}

# 删除安全组
delete_security_group() {
    log_info "删除安全组..."
    
    # 获取默认 VPC ID
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
    
    if [ "$VPC_ID" != "None" ] && [ ! -z "$VPC_ID" ]; then
        # 获取安全组 ID
        SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" \
            --query 'SecurityGroups[0].GroupId' \
            --output text \
            --region $AWS_REGION 2>/dev/null)
        
        if [ "$SECURITY_GROUP_ID" != "None" ] && [ ! -z "$SECURITY_GROUP_ID" ]; then
            aws ec2 delete-security-group \
                --group-id $SECURITY_GROUP_ID \
                --region $AWS_REGION
            
            log_success "安全组删除成功"
        else
            log_warning "安全组不存在或已删除"
        fi
    else
        log_warning "未找到默认 VPC"
    fi
}

# 删除 CloudWatch 日志组
delete_log_group() {
    log_info "删除 CloudWatch 日志组..."
    
    if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP_NAME" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP_NAME"; then
        aws logs delete-log-group \
            --log-group-name "$LOG_GROUP_NAME" \
            --region $AWS_REGION
        
        log_success "CloudWatch 日志组删除成功"
    else
        log_warning "CloudWatch 日志组不存在或已删除"
    fi
}

# 检查剩余资源
check_remaining_resources() {
    log_info "检查剩余资源..."
    
    echo -e "\n${BLUE}=== 资源检查结果 ===${NC}"
    
    # 检查 ECS 服务
    if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        echo -e "${RED}❌ ECS 服务仍然存在${NC}"
    else
        echo -e "${GREEN}✅ ECS 服务已删除${NC}"
    fi
    
    # 检查 ECS 集群
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        echo -e "${RED}❌ ECS 集群仍然存在${NC}"
    else
        echo -e "${GREEN}✅ ECS 集群已删除${NC}"
    fi
    
    # 检查 ECR 仓库
    if aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
        echo -e "${RED}❌ ECR 仓库仍然存在${NC}"
    else
        echo -e "${GREEN}✅ ECR 仓库已删除${NC}"
    fi
    
    # 检查任务定义
    TASK_COUNT=$(aws ecs list-task-definitions --family-prefix $TASK_DEFINITION_NAME --region $AWS_REGION --query 'length(taskDefinitionArns)' --output text 2>/dev/null)
    if [ "$TASK_COUNT" -gt 0 ] 2>/dev/null; then
        echo -e "${YELLOW}⚠️  任务定义已注销但仍在列表中 (正常现象)${NC}"
    else
        echo -e "${GREEN}✅ 任务定义已删除${NC}"
    fi
    
    # 检查日志组
    if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP_NAME" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP_NAME"; then
        echo -e "${RED}❌ CloudWatch 日志组仍然存在${NC}"
    else
        echo -e "${GREEN}✅ CloudWatch 日志组已删除${NC}"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}=== CoinGecko API Server MCP - AWS 资源清理脚本 ===${NC}\n"
    
    # 确认删除
    confirm_deletion
    
    # 检查凭证
    check_aws_credentials
    
    echo -e "\n${BLUE}开始清理 AWS 资源...${NC}\n"
    
    # 执行删除步骤（按依赖关系顺序）
    delete_ecs_service
    delete_ecs_cluster
    delete_task_definitions
    delete_ecr_repository
    delete_security_group
    delete_log_group
    
    # 检查剩余资源
    check_remaining_resources
    
    echo -e "\n${GREEN}=== 清理完成! ===${NC}"
    echo -e "${YELLOW}注意: 某些资源可能需要几分钟才能完全删除。${NC}"
    echo -e "${YELLOW}如果有资源删除失败，请检查 AWS 控制台并手动删除。${NC}"
}

# 运行主函数
main "$@"