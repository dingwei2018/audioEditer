#!/bin/bash

# 基于配置文件的部署脚本
# 使用 deploy.config 文件进行配置

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

# 配置文件路径
CONFIG_FILE="deploy.config"

# 加载配置文件
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_error "配置文件 $CONFIG_FILE 不存在"
        print_info "请复制 deploy.config.example 为 deploy.config 并修改配置"
        exit 1
    fi
    
    print_info "加载配置文件: $CONFIG_FILE"
    source "$CONFIG_FILE"
    
    # 验证必要配置
    if [[ -z "$SERVER_IP" ]] || [[ -z "$SSH_USER" ]] || [[ -z "$SSH_PASSWORD" ]]; then
        print_error "配置文件缺少必要参数"
        exit 1
    fi
    
    # 设置默认值
    SSH_PORT=${SSH_PORT:-22}
    DEPLOY_PATH=${DEPLOY_PATH:-/var/www/audioediter}
    DEPLOY_ENV=${DEPLOY_ENV:-production}
    DEPLOY_MODULES=${DEPLOY_MODULES:-all}
    BACKUP_EXISTING=${BACKUP_EXISTING:-true}
    RESTART_SERVICES=${RESTART_SERVICES:-true}
    BACKEND_PORT=${BACKEND_PORT:-3000}
    FRONTEND_PORT=${FRONTEND_PORT:-80}
}

# 显示配置信息
show_config() {
    echo
    print_info "部署配置:"
    echo "=================================="
    echo "服务器: $SSH_USER@$SERVER_IP:$SSH_PORT"
    echo "部署目录: $DEPLOY_PATH"
    echo "部署环境: $DEPLOY_ENV"
    echo "部署模块: $DEPLOY_MODULES"
    echo "备份现有: $BACKUP_EXISTING"
    echo "重启服务: $RESTART_SERVICES"
    echo "=================================="
    echo
}

# 测试SSH连接
test_connection() {
    print_info "测试SSH连接..."
    
    if command -v sshpass &> /dev/null; then
        if sshpass -p "$SSH_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "echo '连接成功'" 2>/dev/null; then
            print_success "SSH连接成功"
            USE_SSHPASS=true
        else
            print_error "SSH连接失败"
            exit 1
        fi
    else
        print_warning "sshpass 未安装，使用交互式连接"
        if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "echo '连接成功'"; then
            print_success "SSH连接成功"
            USE_SSHPASS=false
        else
            print_error "SSH连接失败"
            exit 1
        fi
    fi
}

# 执行SSH命令
ssh_cmd() {
    local cmd="$1"
    if [[ $USE_SSHPASS == true ]]; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$cmd"
    else
        ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$cmd"
    fi
}

# 执行rsync
rsync_cmd() {
    local src="$1"
    local dest="$2"
    local exclude="$3"
    
    local rsync_opts="-avz --progress"
    if [[ -n "$exclude" ]]; then
        rsync_opts="$rsync_opts --exclude=$exclude"
    fi
    
    if [[ $USE_SSHPASS == true ]]; then
        sshpass -p "$SSH_PASSWORD" rsync $rsync_opts -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$src" "$SSH_USER@$SERVER_IP:$dest"
    else
        rsync $rsync_opts -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$src" "$SSH_USER@$SERVER_IP:$dest"
    fi
}

# 备份现有部署
backup_deployment() {
    if [[ $BACKUP_EXISTING == "true" ]]; then
        print_info "备份现有部署..."
        
        local backup_dir="/tmp/audioediter_backup_$(date +%Y%m%d_%H%M%S)"
        ssh_cmd "mkdir -p $backup_dir"
        
        if ssh_cmd "test -d $DEPLOY_PATH"; then
            ssh_cmd "cp -r $DEPLOY_PATH/* $backup_dir/ 2>/dev/null || true"
            print_success "备份完成: $backup_dir"
        else
            print_info "部署目录不存在，无需备份"
        fi
    fi
}

# 准备部署目录
prepare_directory() {
    print_info "准备部署目录..."
    ssh_cmd "mkdir -p $DEPLOY_PATH/frontend $DEPLOY_PATH/backend"
    print_success "目录准备完成"
}

# 部署前端
deploy_frontend() {
    print_info "部署前端..."
    
    cd frontend
    npm install
    npm run build
    
    if [[ ! -d "dist" ]]; then
        print_error "前端构建失败"
        exit 1
    fi
    
    rsync_cmd "frontend/dist/" "$DEPLOY_PATH/frontend/"
    cd ..
    
    print_success "前端部署完成"
}

# 部署后端
deploy_backend() {
    print_info "部署后端..."
    
    rsync_cmd "backend/" "$DEPLOY_PATH/backend/" "node_modules"
    rsync_cmd "backend/" "$DEPLOY_PATH/backend/" "logs"
    rsync_cmd "backend/" "$DEPLOY_PATH/backend/" "uploads"
    rsync_cmd "backend/" "$DEPLOY_PATH/backend/" "temp"
    
    ssh_cmd "cd $DEPLOY_PATH/backend && npm install --production"
    
    # 创建PM2配置
    cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'audioediter-backend',
    script: 'server.js',
    cwd: '$DEPLOY_PATH/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$DEPLOY_ENV',
      PORT: $BACKEND_PORT
    }
  }]
};
EOF
    
    rsync_cmd "/tmp/ecosystem.config.js" "$DEPLOY_PATH/"
    rm /tmp/ecosystem.config.js
    
    print_success "后端部署完成"
}

# 重启服务
restart_services() {
    if [[ $RESTART_SERVICES == "true" ]]; then
        print_info "重启服务..."
        
        if [[ $DEPLOY_MODULES == *"backend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
            ssh_cmd "cd $DEPLOY_PATH && pm2 delete audioediter-backend 2>/dev/null || true"
            ssh_cmd "cd $DEPLOY_PATH && pm2 start ecosystem.config.js"
        fi
        
        ssh_cmd "nginx -t && systemctl reload nginx" || print_warning "nginx重启失败"
        
        print_success "服务重启完成"
    fi
}

# 显示部署结果
show_result() {
    echo
    print_success "部署完成！"
    echo
    print_info "访问信息:"
    echo "前端: http://$SERVER_IP"
    echo "后端: http://$SERVER_IP:$BACKEND_PORT"
    echo
    print_info "管理命令:"
    echo "查看日志: ssh $SSH_USER@$SERVER_IP 'pm2 logs audioediter-backend'"
    echo "重启服务: ssh $SSH_USER@$SERVER_IP 'pm2 restart audioediter-backend'"
    echo
}

# 主函数
main() {
    echo "=================================="
    echo "    配置文件部署脚本"
    echo "=================================="
    
    load_config
    show_config
    
    read -p "确认开始部署? (y/n): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_warning "部署已取消"
        exit 0
    fi
    
    test_connection
    backup_deployment
    prepare_directory
    
    case $DEPLOY_MODULES in
        "frontend") deploy_frontend ;;
        "backend") deploy_backend ;;
        "all") deploy_frontend; deploy_backend ;;
        *) print_error "无效的部署模块: $DEPLOY_MODULES"; exit 1 ;;
    esac
    
    restart_services
    show_result
}

# 错误处理
trap 'print_error "部署失败"; exit 1' ERR

main "$@"
