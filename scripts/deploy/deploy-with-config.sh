#!/bin/bash

# 使用配置文件的部署脚本
# 读取 deploy.config 配置文件进行部署

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

# 检查配置文件
check_config() {
    local config_file="$(dirname "$0")/../../deploy.config"
    if [[ ! -f "$config_file" ]]; then
        print_error "配置文件 deploy.config 不存在"
        print_info "请先创建配置文件或使用 deploy.config.example 作为模板"
        print_info "配置文件应在项目根目录: $config_file"
        exit 1
    fi
    
    print_info "加载配置文件..."
    source "$config_file"
    
    # 验证必要的配置项
    if [[ -z "$SERVER_IP" || -z "$SSH_USER" || -z "$SSH_PASSWORD" ]]; then
        print_error "配置文件缺少必要的参数 (SERVER_IP, SSH_USER, SSH_PASSWORD)"
        exit 1
    fi
    
    # 设置默认值
    SSH_PORT=${SSH_PORT:-22}
    DEPLOY_PATH=${DEPLOY_PATH:-/var/www/audioediter}
    DEPLOY_MODULES=${DEPLOY_MODULES:-frontend}
    DEPLOY_ENV=${DEPLOY_ENV:-production}
    BACKUP_EXISTING=${BACKUP_EXISTING:-true}
    RESTART_SERVICES=${RESTART_SERVICES:-true}
    
    print_success "配置文件加载完成"
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
}

# 测试SSH连接
test_ssh_connection() {
    print_info "测试SSH连接..."
    
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

# 检查服务器环境
check_server_environment() {
    print_info "检查服务器环境..."
    
    # 检查操作系统
    local os_info=$(run_ssh_command "cat /etc/os-release | grep '^PRETTY_NAME=' | cut -d'=' -f2 | tr -d '\"'")
    local os_id=$(run_ssh_command "cat /etc/os-release | grep '^ID=' | cut -d'=' -f2 | tr -d '\"'")
    print_info "操作系统: $os_info"
    print_info "系统ID: $os_id"
    
    # 检查包管理器
    local package_manager=""
    if run_ssh_command "command -v yum >/dev/null 2>&1"; then
        package_manager="yum"
    elif run_ssh_command "command -v apt-get >/dev/null 2>&1"; then
        package_manager="apt-get"
    elif run_ssh_command "command -v dnf >/dev/null 2>&1"; then
        package_manager="dnf"
    else
        print_error "未找到支持的包管理器"
        exit 1
    fi
    print_info "包管理器: $package_manager"
    
    # 特殊处理EulerOS系统
    if [[ "$os_id" == "euleros" ]]; then
        print_info "检测到EulerOS系统，使用特殊安装策略"
    fi
    
    # 检查Node.js
    local node_version=""
    if run_ssh_command "command -v node >/dev/null 2>&1"; then
        node_version=$(run_ssh_command "node --version 2>/dev/null" | tr -d 'v')
        print_info "Node.js版本: v$node_version"
        
        # 检查Node.js版本是否满足要求
        local required_version="14.0.0"
        if ! check_version "$node_version" "$required_version"; then
            print_warning "Node.js版本过低，需要升级到 v$required_version 或更高版本"
            install_nodejs "$package_manager"
        fi
    else
        print_warning "Node.js未安装，正在安装..."
        install_nodejs "$package_manager"
    fi
    
    # 检查npm
    if ! run_ssh_command "command -v npm >/dev/null 2>&1"; then
        print_error "npm未安装，请检查Node.js安装"
        exit 1
    fi
    
    # 检查PM2
    if ! run_ssh_command "command -v pm2 >/dev/null 2>&1"; then
        print_warning "PM2未安装，正在安装..."
        install_pm2
    fi
    
    # 检查Nginx
    if ! run_ssh_command "command -v nginx >/dev/null 2>&1"; then
        print_warning "Nginx未安装，正在安装..."
        install_nginx "$package_manager"
    fi
    
    # 检查防火墙状态
    check_firewall
    
    print_success "服务器环境检查完成"
}

# 版本比较函数
check_version() {
    local version1="$1"
    local version2="$2"
    
    # 移除版本号中的非数字字符，只保留主版本号进行比较
    local v1_major=$(echo "$version1" | cut -d'.' -f1)
    local v2_major=$(echo "$version2" | cut -d'.' -f1)
    
    if [ "$v1_major" -ge "$v2_major" ]; then
        return 0
    else
        return 1
    fi
}

# 安装Node.js
install_nodejs() {
    local package_manager="$1"
    print_info "安装Node.js..."
    
    # 检测操作系统版本
    local os_id=$(run_ssh_command "cat /etc/os-release | grep '^ID=' | cut -d'=' -f2 | tr -d '\"'")
    local os_version=$(run_ssh_command "cat /etc/os-release | grep '^VERSION_ID=' | cut -d'=' -f2 | tr -d '\"'")
    
    print_info "检测到系统: $os_id $os_version"
    
    case "$package_manager" in
        "yum")
            # 对于CentOS/RHEL/EulerOS系统，优先使用系统仓库
            print_info "使用yum安装Node.js..."
            
            # 特殊处理EulerOS系统
            if [[ "$os_id" == "euleros" ]]; then
                print_info "EulerOS系统，尝试多种安装方法..."
                
                # 方法1: 直接使用yum安装
                if run_ssh_command "yum install -y nodejs npm"; then
                    print_success "使用yum直接安装成功"
                else
                    print_warning "yum直接安装失败，尝试其他方法..."
                    
                    # 方法2: 使用二进制包安装
                    print_info "尝试使用二进制包安装..."
                    if run_ssh_command "curl -fsSL https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz -o /tmp/node.tar.xz && cd /tmp && tar -xf node.tar.xz && cp -r node-v18.17.0-linux-x64/* /usr/local/ && ln -sf /usr/local/bin/node /usr/bin/node && ln -sf /usr/local/bin/npm /usr/bin/npm"; then
                        print_success "使用二进制包安装成功"
                    else
                        print_error "所有安装方法都失败了"
                        print_info "请手动安装Node.js或使用提供的install-nodejs-euleros.sh脚本"
                        exit 1
                    fi
                fi
            else
                # 非EulerOS系统使用原有逻辑
                run_ssh_command "yum install -y nodejs npm" || {
                    print_warning "系统仓库安装失败，尝试使用NodeSource仓库"
                    # 检查系统是否支持NodeSource
                    if [[ "$os_id" == "centos" || "$os_id" == "rhel" || "$os_id" == "fedora" ]]; then
                        run_ssh_command "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -" && \
                        run_ssh_command "yum install -y nodejs npm"
                    else
                        print_error "当前系统不支持NodeSource仓库，请手动安装Node.js"
                        exit 1
                    fi
                }
            fi
            ;;
        "apt-get")
            # 对于Ubuntu/Debian系统
            print_info "使用apt-get安装Node.js..."
            run_ssh_command "apt-get update && apt-get install -y nodejs npm" || {
                print_warning "系统仓库安装失败，尝试使用NodeSource仓库"
                if [[ "$os_id" == "ubuntu" || "$os_id" == "debian" ]]; then
                    run_ssh_command "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -" && \
                    run_ssh_command "apt-get install -y nodejs"
                else
                    print_error "当前系统不支持NodeSource仓库，请手动安装Node.js"
                    exit 1
                fi
            }
            ;;
        "dnf")
            # 对于Fedora系统
            print_info "使用dnf安装Node.js..."
            run_ssh_command "dnf install -y nodejs npm" || {
                print_warning "系统仓库安装失败，尝试使用NodeSource仓库"
                if [[ "$os_id" == "fedora" || "$os_id" == "centos" ]]; then
                    run_ssh_command "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -" && \
                    run_ssh_command "dnf install -y nodejs npm"
                else
                    print_error "当前系统不支持NodeSource仓库，请手动安装Node.js"
                    exit 1
                fi
            }
            ;;
    esac
    
    # 验证安装
    if run_ssh_command "command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1"; then
        local new_version=$(run_ssh_command "node --version 2>/dev/null")
        print_success "Node.js安装成功: $new_version"
        
        # 检查版本是否满足要求
        local installed_version=$(echo "$new_version" | tr -d 'v')
        local required_version="14.0.0"
        if ! check_version "$installed_version" "$required_version"; then
            print_warning "安装的Node.js版本($new_version)可能过低，建议升级到v14或更高版本"
            print_info "如果遇到语法错误，请考虑手动安装更新版本的Node.js"
        fi
    else
        print_error "Node.js安装失败"
        print_info "请尝试手动安装Node.js:"
        print_info "1. 访问 https://nodejs.org/ 下载适合您系统的版本"
        print_info "2. 或使用包管理器手动安装: $package_manager install nodejs npm"
        exit 1
    fi
}

# 安装PM2
install_pm2() {
    print_info "安装PM2..."
    run_ssh_command "npm install -g pm2"
    
    if run_ssh_command "command -v pm2 >/dev/null 2>&1"; then
        print_success "PM2安装成功"
    else
        print_error "PM2安装失败"
        exit 1
    fi
}

# 安装Nginx
install_nginx() {
    local package_manager="$1"
    print_info "安装Nginx..."
    
    case "$package_manager" in
        "yum"|"dnf")
            run_ssh_command "$package_manager install -y nginx"
            ;;
        "apt-get")
            run_ssh_command "apt-get update && apt-get install -y nginx"
            ;;
    esac
    
    # 启动并启用Nginx
    run_ssh_command "systemctl start nginx"
    run_ssh_command "systemctl enable nginx"
    
    if run_ssh_command "command -v nginx >/dev/null 2>&1"; then
        print_success "Nginx安装并启动成功"
    else
        print_error "Nginx安装失败"
        exit 1
    fi
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
            run_ssh_command "firewall-cmd --permanent --add-port=80/tcp"
            run_ssh_command "firewall-cmd --reload"
        fi
        
        # 检查后端API端口是否开放
        if ! run_ssh_command "firewall-cmd --query-port=${BACKEND_PORT:-3000}/tcp 2>/dev/null"; then
            print_warning "后端端口${BACKEND_PORT:-3000}未开放，正在添加..."
            run_ssh_command "firewall-cmd --permanent --add-port=${BACKEND_PORT:-3000}/tcp"
            run_ssh_command "firewall-cmd --reload"
        fi
        
        print_success "防火墙配置完成"
    elif run_ssh_command "systemctl is-active --quiet ufw 2>/dev/null"; then
        print_info "UFW防火墙正在运行，检查端口配置..."
        
        # 检查HTTP端口
        if ! run_ssh_command "ufw status | grep -q '80/tcp' 2>/dev/null"; then
            print_warning "HTTP端口80未开放，正在添加..."
            run_ssh_command "ufw allow 80/tcp"
        fi
        
        # 检查后端API端口
        if ! run_ssh_command "ufw status | grep -q '${BACKEND_PORT:-3000}/tcp' 2>/dev/null"; then
            print_warning "后端端口${BACKEND_PORT:-3000}未开放，正在添加..."
            run_ssh_command "ufw allow ${BACKEND_PORT:-3000}/tcp"
        fi
        
        print_success "防火墙配置完成"
    else
        print_info "未检测到活跃的防火墙，端口应该可以直接访问"
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
    local exclude_options="$3"
    
    local rsync_cmd="rsync -avz --progress"
    if [[ -n $exclude_options ]]; then
        rsync_cmd="$rsync_cmd $exclude_options"
    fi
    
    if [[ $USE_SSHPASS == true ]]; then
        sshpass -p "$SSH_PASSWORD" $rsync_cmd -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$source" "$SSH_USER@$SERVER_IP:$dest"
    else
        $rsync_cmd -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" "$source" "$SSH_USER@$SERVER_IP:$dest"
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

# 部署后端
deploy_backend() {
    print_info "开始部署后端..."
    
    # 确保在项目根目录
    cd "$(dirname "$0")/../.."
    
    # 同步后端文件
    print_info "同步后端文件到服务器..."
    run_rsync "./backend/" "$DEPLOY_PATH/backend/" "--exclude=node_modules --exclude=logs --exclude=uploads --exclude=temp --exclude=.git"
    
    # 安装后端依赖
    print_info "安装后端依赖..."
    run_ssh_command "cd $DEPLOY_PATH/backend && npm install --production"
    
    # 创建PM2配置文件
    print_info "创建PM2配置文件..."
    cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'audioediter-backend',
    script: 'src/server.js',
    cwd: '$DEPLOY_PATH/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$DEPLOY_ENV',
      PORT: ${BACKEND_PORT:-3000}
    }
  }]
};
EOF
    
    run_rsync "/tmp/ecosystem.config.js" "$DEPLOY_PATH/"
    rm /tmp/ecosystem.config.js
    
    print_success "后端部署完成"
}

# 管理后端服务
manage_backend_service() {
    print_info "管理后端服务..."
    
    # 检查PM2是否安装
    if ! run_ssh_command "command -v pm2 >/dev/null 2>&1"; then
        print_info "安装PM2..."
        run_ssh_command "npm install -g pm2"
    fi
    
    # 检查服务是否已经在运行
    if run_ssh_command "pm2 describe audioediter-backend >/dev/null 2>&1"; then
        print_info "后端服务已在运行，正在重启..."
        run_ssh_command "cd $DEPLOY_PATH && pm2 restart audioediter-backend"
    else
        print_info "启动后端服务..."
        run_ssh_command "cd $DEPLOY_PATH && pm2 start ecosystem.config.js"
    fi
    
    # 保存PM2配置
    run_ssh_command "pm2 save"
    
    # 设置开机自启
    run_ssh_command "pm2 startup | grep -E '^sudo' | bash" || print_warning "PM2开机自启设置失败，请手动配置"
    
    print_success "后端服务管理完成"
}

# 配置Nginx
configure_nginx() {
    print_info "配置Nginx..."
    
    # 创建nginx配置文件
    cat > /tmp/nginx_audioediter.conf << EOF
# 默认服务器块，处理所有未匹配的域名
server {
    listen ${FRONTEND_PORT:-80} default_server;
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
    listen ${FRONTEND_PORT:-80};
    server_name ${FRONTEND_DOMAIN:-_};
    root $DEPLOY_PATH/frontend;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:${BACKEND_PORT:-3000}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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

# 显示服务状态
show_service_status() {
    print_info "服务状态检查..."
    
    echo
    print_info "=== PM2 服务状态 ==="
    run_ssh_command "pm2 list"
    
    echo
    print_info "=== Nginx 状态 ==="
    run_ssh_command "systemctl status nginx --no-pager -l"
    
    echo
    print_info "=== 端口监听状态 ==="
    run_ssh_command "netstat -tlnp | grep -E ':(80|3000|${BACKEND_PORT:-3000})' || ss -tlnp | grep -E ':(80|3000|${BACKEND_PORT:-3000})'"
}

# 主函数
main() {
    echo "=================================="
    echo "    音频编辑器配置部署脚本"
    echo "=================================="
    echo
    
    # 检查配置文件
    check_config
    
    # 显示配置摘要
    show_config_summary
    
    # 测试SSH连接
    test_ssh_connection
    
    # 检查服务器环境
    check_server_environment
    
    # 准备部署目录
    prepare_deploy_directory
    
    # 根据配置的模块进行部署
    if [[ $DEPLOY_MODULES == *"frontend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
        deploy_frontend
    fi
    
    if [[ $DEPLOY_MODULES == *"backend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
        deploy_backend
    fi
    
    # 服务管理
    if [[ $RESTART_SERVICES =~ ^[Yy]$ ]] || [[ $RESTART_SERVICES == "true" ]]; then
        # 配置Nginx
        if [[ $DEPLOY_MODULES == *"frontend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
            configure_nginx
        fi
        
        # 管理后端服务
        if [[ $DEPLOY_MODULES == *"backend"* ]] || [[ $DEPLOY_MODULES == "all" ]]; then
            manage_backend_service
        fi
        
        # 显示服务状态
        show_service_status
    fi
    
    # 显示部署结果
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
    echo "查看PM2状态: ssh $SSH_USER@$SERVER_IP 'pm2 list'"
    echo
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"