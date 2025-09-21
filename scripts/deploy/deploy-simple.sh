#!/bin/bash

# 简化版部署脚本
# 适用于快速部署和测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 快速配置
quick_config() {
    echo "=================================="
    echo "    快速部署配置"
    echo "=================================="
    
    read -p "服务器IP: " SERVER_IP
    read -p "SSH用户 (默认root): " SSH_USER
    SSH_USER=${SSH_USER:-root}
    read -s -p "SSH密码: " SSH_PASSWORD
    echo
    read -p "部署目录 (默认/var/www/audioediter): " DEPLOY_PATH
    DEPLOY_PATH=${DEPLOY_PATH:-/var/www/audioediter}
    
    echo
    echo "1) 仅前端  2) 仅后端  3) 全部"
    read -p "选择部署模块 (1-3): " MODULE_CHOICE
    
    case $MODULE_CHOICE in
        1) DEPLOY_MODULES="frontend" ;;
        2) DEPLOY_MODULES="backend" ;;
        3) DEPLOY_MODULES="all" ;;
        *) print_error "无效选择"; exit 1 ;;
    esac
}

# 部署前端
deploy_frontend() {
    print_info "部署前端..."
    
    # 确保在项目根目录
    cd "$(dirname "$0")/../.."
    
    # 进入前端目录构建
    cd frontend
    npm install
    npm run build
    
    # 检查构建结果
    if [[ ! -d "dist" ]]; then
        print_error "前端构建失败，dist目录不存在"
        exit 1
    fi
    
    # 返回项目根目录
    cd ..
    
    # 使用绝对路径进行rsync同步
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" ./frontend/dist/ $SSH_USER@$SERVER_IP:$DEPLOY_PATH/frontend/
    else
        rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" ./frontend/dist/ $SSH_USER@$SERVER_IP:$DEPLOY_PATH/frontend/
    fi
    
    print_success "前端部署完成"
}

# 部署后端
deploy_backend() {
    print_info "部署后端..."
    
    # 确保在项目根目录
    cd "$(dirname "$0")/../.."
    
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" --exclude=node_modules --exclude=logs ./backend/ $SSH_USER@$SERVER_IP:$DEPLOY_PATH/backend/
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "cd $DEPLOY_PATH/backend && npm install --production"
    else
        rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" --exclude=node_modules --exclude=logs ./backend/ $SSH_USER@$SERVER_IP:$DEPLOY_PATH/backend/
        ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "cd $DEPLOY_PATH/backend && npm install --production"
    fi
    
    print_success "后端部署完成"
}

# 主函数
main() {
    quick_config
    
    print_info "开始部署到 $SERVER_IP:$DEPLOY_PATH"
    
    # 创建部署目录
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"
    else
        ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"
    fi
    
    # 部署模块
    case $DEPLOY_MODULES in
        "frontend") deploy_frontend ;;
        "backend") deploy_backend ;;
        "all") deploy_frontend; deploy_backend ;;
    esac
    
    print_success "部署完成！"
    echo "访问地址: http://$SERVER_IP"
}

main "$@"
