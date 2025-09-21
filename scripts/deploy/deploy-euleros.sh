#!/bin/bash

# 华为云EulerOS专用部署脚本
# 专门针对EulerOS系统的部署优化

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

# 配置变量
SERVER_IP="120.46.214.157"
SSH_USER="root"
SSH_PASSWORD="audioediter@2025"
SSH_PORT="22"
DEPLOY_PATH="/var/www/audioediter"
DEPLOY_MODULES="frontend"
FRONTEND_DOMAIN="audioediter.iappprogramer.com"
FRONTEND_PORT="80"
BACKEND_PORT="3000"

# 执行SSH命令
run_ssh_command() {
    local command="$1"
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$command"
}

# 执行rsync同步
run_rsync() {
    local source="$1"
    local dest="$2"
    local exclude_options="$3"
    
    local rsync_cmd="rsync -avz --progress"
    if [[ -n $exclude_options ]]; then
        rsync_cmd="$rsync_cmd $exclude_options"
    fi
    
    sshpass -p "$SSH_PASSWORD" $rsync_cmd -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$source" "$SSH_USER@$SERVER_IP:$dest"
}

# 检查Node.js安装
check_nodejs() {
    print_info "检查Node.js安装..."
    
    if ! run_ssh_command "command -v node >/dev/null 2>&1"; then
        print_warning "Node.js未安装，正在安装..."
        
        # 尝试多种安装方法
        if run_ssh_command "yum install -y nodejs npm"; then
            print_success "使用yum安装Node.js成功"
        else
            print_warning "yum安装失败，尝试二进制包安装..."
            if run_ssh_command "curl -fsSL https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz -o /tmp/node.tar.xz && cd /tmp && tar -xf node.tar.xz && cp -r node-v18.17.0-linux-x64/* /usr/local/ && ln -sf /usr/local/bin/node /usr/bin/node && ln -sf /usr/local/bin/npm /usr/bin/npm && rm -rf /tmp/node*"; then
                print_success "使用二进制包安装Node.js成功"
            else
                print_error "Node.js安装失败"
                exit 1
            fi
        fi
    else
        local node_version=$(run_ssh_command "node --version")
        print_success "Node.js已安装: $node_version"
    fi
}

# 检查npm安装
check_npm() {
    print_info "检查npm安装..."
    
    if ! run_ssh_command "command -v npm >/dev/null 2>&1"; then
        print_error "npm未安装，请检查Node.js安装"
        exit 1
    else
        local npm_version=$(run_ssh_command "npm --version")
        print_success "npm已安装: $npm_version"
    fi
}

# 检查Nginx安装
check_nginx() {
    print_info "检查Nginx安装..."
    
    if ! run_ssh_command "command -v nginx >/dev/null 2>&1"; then
        print_warning "Nginx未安装，正在安装..."
        if run_ssh_command "yum install -y nginx && systemctl start nginx && systemctl enable nginx"; then
            print_success "Nginx安装并启动成功"
        else
            print_error "Nginx安装失败"
            exit 1
        fi
    else
        print_success "Nginx已安装"
        # 确保Nginx正在运行
        if ! run_ssh_command "systemctl is-active nginx >/dev/null 2>&1"; then
            print_info "启动Nginx..."
            run_ssh_command "systemctl start nginx"
        fi
    fi
}

# 准备部署目录
prepare_deploy_directory() {
    print_info "准备部署目录..."
    run_ssh_command "mkdir -p $DEPLOY_PATH/frontend"
    print_success "部署目录准备完成"
}

# 部署前端
deploy_frontend() {
    print_info "开始部署前端..."
    
    # 确保在项目根目录
    cd "$(dirname "$0")/../.."
    
    # 构建前端
    print_info "构建前端项目..."
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
    
    # 同步前端文件
    print_info "同步前端文件到服务器..."
    run_rsync "./frontend/dist/" "$DEPLOY_PATH/frontend/"
    
    print_success "前端部署完成"
}

# 配置Nginx
configure_nginx() {
    print_info "配置Nginx..."
    
    # 创建nginx配置文件
    cat > /tmp/nginx_audioediter.conf << EOF
# 默认服务器块，处理所有未匹配的域名
server {
    listen ${FRONTEND_PORT} default_server;
    server_name _;
    root $DEPLOY_PATH/frontend;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

# 特定域名服务器块
server {
    listen ${FRONTEND_PORT};
    server_name ${FRONTEND_DOMAIN};
    root $DEPLOY_PATH/frontend;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    # 上传nginx配置
    run_rsync "/tmp/nginx_audioediter.conf" "/etc/nginx/conf.d/audioediter.conf"
    
    # 测试nginx配置
    if run_ssh_command "nginx -t"; then
        print_info "重新加载Nginx配置..."
        run_ssh_command "systemctl reload nginx"
        print_success "Nginx配置完成"
    else
        print_error "Nginx配置测试失败"
        exit 1
    fi
    
    rm /tmp/nginx_audioediter.conf
}

# 检查防火墙
check_firewall() {
    print_info "检查防火墙状态..."
    
    # 检查防火墙是否运行
    if run_ssh_command "systemctl is-active --quiet firewalld 2>/dev/null"; then
        print_info "Firewalld正在运行，检查端口配置..."
        
        # 检查HTTP端口是否开放
        if ! run_ssh_command "firewall-cmd --query-port=80/tcp 2>/dev/null"; then
            print_warning "HTTP端口80未开放，正在添加..."
            run_ssh_command "firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload"
        fi
        
        print_success "防火墙配置完成"
    else
        print_info "未检测到活跃的防火墙，端口应该可以直接访问"
    fi
}

# 显示服务状态
show_service_status() {
    print_info "服务状态检查..."
    
    echo
    print_info "=== Nginx 状态 ==="
    run_ssh_command "systemctl status nginx --no-pager -l"
    
    echo
    print_info "=== 端口监听状态 ==="
    run_ssh_command "netstat -tlnp | grep :80 || ss -tlnp | grep :80"
}

# 主函数
main() {
    echo "=================================="
    echo "   华为云EulerOS专用部署脚本"
    echo "=================================="
    echo
    
    print_info "部署配置:"
    echo "服务器IP: $SERVER_IP"
    echo "部署目录: $DEPLOY_PATH"
    echo "部署模块: $DEPLOY_MODULES"
    echo "域名: $FRONTEND_DOMAIN"
    echo "=================================="
    echo
    
    # 检查Node.js
    check_nodejs
    
    # 检查npm
    check_npm
    
    # 检查Nginx
    check_nginx
    
    # 准备部署目录
    prepare_deploy_directory
    
    # 部署前端
    deploy_frontend
    
    # 配置Nginx
    configure_nginx
    
    # 检查防火墙
    check_firewall
    
    # 显示服务状态
    show_service_status
    
    # 显示部署结果
    echo
    print_success "部署完成！"
    echo
    print_info "部署信息:"
    echo "=================================="
    echo "前端访问地址: http://$SERVER_IP"
    echo "域名访问地址: http://$FRONTEND_DOMAIN"
    echo "部署目录: $DEPLOY_PATH"
    echo "=================================="
    echo
    
    print_info "常用管理命令:"
    echo "查看nginx状态: ssh $SSH_USER@$SERVER_IP 'systemctl status nginx'"
    echo "重启nginx: ssh $SSH_USER@$SERVER_IP 'systemctl restart nginx'"
    echo "查看nginx日志: ssh $SSH_USER@$SERVER_IP 'tail -f /var/log/nginx/error.log'"
    echo
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
