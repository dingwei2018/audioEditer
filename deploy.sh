#!/bin/bash

# 音频编辑器部署脚本
# 支持交互式配置部署参数

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_dependencies() {
    print_info "检查部署依赖..."
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH 客户端未安装，请先安装 OpenSSH"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync 未安装，请先安装 rsync"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 Node.js 和 npm"
        exit 1
    fi
    
    print_success "依赖检查完成"
}

# 交互式配置部署参数
configure_deployment() {
    print_info "开始配置部署参数..."
    echo
    
    # 服务器IP地址
    while true; do
        read -p "请输入目标服务器IP地址: " SERVER_IP
        if [[ $SERVER_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            break
        else
            print_error "请输入有效的IP地址格式"
        fi
    done
    
    # 用户名
    read -p "请输入SSH用户名 (默认: root): " SSH_USER
    SSH_USER=${SSH_USER:-root}
    
    # 密码
    read -s -p "请输入SSH密码: " SSH_PASSWORD
    echo
    
    # 端口
    read -p "请输入SSH端口 (默认: 22): " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    
    # 部署目录
    read -p "请输入服务器部署目录 (默认: /var/www/audioediter): " DEPLOY_PATH
    DEPLOY_PATH=${DEPLOY_PATH:-/var/www/audioediter}
    
    # 部署模块选择
    echo
    print_info "请选择要部署的模块:"
    echo "1) 仅前端 (frontend)"
    echo "2) 仅后端 (backend)"
    echo "3) 前后端都部署 (all)"
    echo "4) 自定义选择"
    
    while true; do
        read -p "请选择 (1-4): " MODULE_CHOICE
        case $MODULE_CHOICE in
            1)
                DEPLOY_MODULES="frontend"
                break
                ;;
            2)
                DEPLOY_MODULES="backend"
                break
                ;;
            3)
                DEPLOY_MODULES="all"
                break
                ;;
            4)
                echo
                print_info "自定义模块选择:"
                read -p "部署前端? (y/n): " DEPLOY_FRONTEND
                read -p "部署后端? (y/n): " DEPLOY_BACKEND
                
                DEPLOY_MODULES=""
                if [[ $DEPLOY_FRONTEND =~ ^[Yy]$ ]]; then
                    DEPLOY_MODULES="frontend"
                fi
                if [[ $DEPLOY_BACKEND =~ ^[Yy]$ ]]; then
                    if [[ -n $DEPLOY_MODULES ]]; then
                        DEPLOY_MODULES="$DEPLOY_MODULES,backend"
                    else
                        DEPLOY_MODULES="backend"
                    fi
                fi
                
                if [[ -z $DEPLOY_MODULES ]]; then
                    print_error "至少需要选择一个模块进行部署"
                    continue
                fi
                break
                ;;
            *)
                print_error "请输入有效的选择 (1-4)"
                ;;
        esac
    done
    
    # 环境选择
    echo
    print_info "请选择部署环境:"
    echo "1) 开发环境 (development)"
    echo "2) 生产环境 (production)"
    echo "3) 测试环境 (testing)"
    
    while true; do
        read -p "请选择环境 (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1)
                DEPLOY_ENV="development"
                break
                ;;
            2)
                DEPLOY_ENV="production"
                break
                ;;
            3)
                DEPLOY_ENV="testing"
                break
                ;;
            *)
                print_error "请输入有效的选择 (1-3)"
                ;;
        esac
    done
    
    # 是否备份现有部署
    read -p "是否备份现有部署? (y/n, 默认: y): " BACKUP_EXISTING
    BACKUP_EXISTING=${BACKUP_EXISTING:-y}
    
    # 是否重启服务
    read -p "部署完成后是否重启服务? (y/n, 默认: y): " RESTART_SERVICES
    RESTART_SERVICES=${RESTART_SERVICES:-y}
    
    echo
    print_success "配置完成！"
}

# 显示配置摘要
show_config_summary() {
    echo
    print_info "部署配置摘要:"
    echo "=================================="
    echo "服务器IP: $SERVER_IP"
    echo "SSH用户: $SSH_USER"
    echo "SSH端口: $SSH_PORT"
    echo "部署目录: $DEPLOY_PATH"
    echo "部署模块: $DEPLOY_MODULES"
    echo "部署环境: $DEPLOY_ENV"
    echo "备份现有: $BACKUP_EXISTING"
    echo "重启服务: $RESTART_SERVICES"
    echo "=================================="
    echo
    
    read -p "确认开始部署? (y/n): " CONFIRM_DEPLOY
    if [[ ! $CONFIRM_DEPLOY =~ ^[Yy]$ ]]; then
        print_warning "部署已取消"
        exit 0
    fi
}

# 测试SSH连接
test_ssh_connection() {
    print_info "测试SSH连接..."
    
    # 使用sshpass进行密码认证（如果可用）
    if command -v sshpass &> /dev/null; then
        if sshpass -p "$SSH_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "echo 'SSH连接成功'" 2>/dev/null; then
            print_success "SSH连接测试成功"
            USE_SSHPASS=true
        else
            print_error "SSH连接失败，请检查服务器信息"
            exit 1
        fi
    else
        print_warning "sshpass 未安装，将使用交互式SSH连接"
        print_info "请手动输入密码进行连接测试"
        if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "echo 'SSH连接成功'"; then
            print_success "SSH连接测试成功"
            USE_SSHPASS=false
        else
            print_error "SSH连接失败，请检查服务器信息"
            exit 1
        fi
    fi
}

# 执行SSH命令
run_ssh_command() {
    local command="$1"
    if [[ $USE_SSHPASS == true ]]; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$command"
    else
        ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$command"
    fi
}

# 执行rsync同步
run_rsync() {
    local source="$1"
    local dest="$2"
    local exclude_file="$3"
    
    local rsync_cmd="rsync -avz --progress"
    if [[ -n $exclude_file ]]; then
        rsync_cmd="$rsync_cmd --exclude-from=$exclude_file"
    fi
    
    if [[ $USE_SSHPASS == true ]]; then
        sshpass -p "$SSH_PASSWORD" $rsync_cmd -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$source" "$SSH_USER@$SERVER_IP:$dest"
    else
        $rsync_cmd -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$source" "$SSH_USER@$SERVER_IP:$dest"
    fi
}

# 备份现有部署
backup_existing_deployment() {
    if [[ $BACKUP_EXISTING =~ ^[Yy]$ ]]; then
        print_info "备份现有部署..."
        
        local backup_dir="/tmp/audioediter_backup_$(date +%Y%m%d_%H%M%S)"
        
        run_ssh_command "mkdir -p $backup_dir"
        
        if run_ssh_command "test -d $DEPLOY_PATH"; then
            run_ssh_command "cp -r $DEPLOY_PATH/* $backup_dir/ 2>/dev/null || true"
            print_success "现有部署已备份到: $backup_dir"
        else
            print_info "部署目录不存在，无需备份"
        fi
    fi
}

# 准备部署目录
prepare_deploy_directory() {
    print_info "准备部署目录..."
    
    run_ssh_command "mkdir -p $DEPLOY_PATH"
    run_ssh_command "mkdir -p $DEPLOY_PATH/frontend"
    run_ssh_command "mkdir -p $DEPLOY_PATH/backend"
    
    print_success "部署目录准备完成"
}

# 部署前端
deploy_frontend() {
    print_info "开始部署前端..."
    
    # 构建前端
    print_info "构建前端项目..."
    cd frontend
    npm install
    npm run build
    
    if [[ ! -d "dist" ]]; then
        print_error "前端构建失败，dist目录不存在"
        exit 1
    fi
    
    # 同步前端文件
    print_info "同步前端文件到服务器..."
    run_rsync "frontend/dist/" "$DEPLOY_PATH/frontend/"
    
    # 创建nginx配置
    print_info "创建nginx配置文件..."
    cat > /tmp/nginx_audioediter.conf << EOF
server {
    listen 80;
    server_name _;
    root $DEPLOY_PATH/frontend;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    run_rsync "/tmp/nginx_audioediter.conf" "$DEPLOY_PATH/"
    rm /tmp/nginx_audioediter.conf
    
    cd ..
    print_success "前端部署完成"
}

# 部署后端
deploy_backend() {
    print_info "开始部署后端..."
    
    # 同步后端文件
    print_info "同步后端文件到服务器..."
    run_rsync "backend/" "$DEPLOY_PATH/backend/" "--exclude=node_modules --exclude=logs --exclude=uploads --exclude=temp"
    
    # 安装后端依赖
    print_info "安装后端依赖..."
    run_ssh_command "cd $DEPLOY_PATH/backend && npm install --production"
    
    # 创建PM2配置文件
    print_info "创建PM2配置文件..."
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
      PORT: 3000
    }
  }]
};
EOF
    
    run_rsync "/tmp/ecosystem.config.js" "$DEPLOY_PATH/"
    rm /tmp/ecosystem.config.js
    
    print_success "后端部署完成"
}

# 重启服务
restart_services() {
    if [[ $RESTART_SERVICES =~ ^[Yy]$ ]]; then
        print_info "重启服务..."
        
        # 重启后端服务
        if [[ $DEPLOY_MODULES == *"backend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
            print_info "重启后端服务..."
            run_ssh_command "cd $DEPLOY_PATH && pm2 delete audioediter-backend 2>/dev/null || true"
            run_ssh_command "cd $DEPLOY_PATH && pm2 start ecosystem.config.js"
        fi
        
        # 重启nginx
        print_info "重启nginx..."
        run_ssh_command "nginx -t && systemctl reload nginx" || print_warning "nginx重启失败，请手动检查配置"
        
        print_success "服务重启完成"
    fi
}

# 显示部署结果
show_deployment_result() {
    echo
    print_success "部署完成！"
    echo
    print_info "部署信息:"
    echo "=================================="
    echo "前端访问地址: http://$SERVER_IP"
    echo "后端API地址: http://$SERVER_IP/api"
    echo "部署目录: $DEPLOY_PATH"
    echo "=================================="
    echo
    
    print_info "常用管理命令:"
    echo "查看后端日志: ssh $SSH_USER@$SERVER_IP 'pm2 logs audioediter-backend'"
    echo "重启后端: ssh $SSH_USER@$SERVER_IP 'pm2 restart audioediter-backend'"
    echo "查看nginx状态: ssh $SSH_USER@$SERVER_IP 'systemctl status nginx'"
    echo
}

# 主函数
main() {
    echo "=================================="
    echo "    音频编辑器部署脚本"
    echo "=================================="
    echo
    
    # 检查依赖
    check_dependencies
    
    # 配置部署参数
    configure_deployment
    
    # 显示配置摘要
    show_config_summary
    
    # 测试SSH连接
    test_ssh_connection
    
    # 备份现有部署
    backup_existing_deployment
    
    # 准备部署目录
    prepare_deploy_directory
    
    # 根据选择的模块进行部署
    if [[ $DEPLOY_MODULES == *"frontend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
        deploy_frontend
    fi
    
    if [[ $DEPLOY_MODULES == *"backend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
        deploy_backend
    fi
    
    # 重启服务
    restart_services
    
    # 显示部署结果
    show_deployment_result
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
