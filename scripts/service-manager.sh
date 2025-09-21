#!/bin/bash

# 音频编辑器服务管理脚本
# 用于启动、停止、重启服务

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
    if [[ ! -f "deploy.config" ]]; then
        print_error "配置文件 deploy.config 不存在"
        exit 1
    fi
    
    source deploy.config
    
    # 设置默认值
    SSH_PORT=${SSH_PORT:-22}
    DEPLOY_PATH=${DEPLOY_PATH:-/var/www/audioediter}
    BACKEND_PORT=${BACKEND_PORT:-3000}
}

# 执行SSH命令
run_ssh_command() {
    local command="$1"
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$command"
    else
        ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$command"
    fi
}

# 启动后端服务
start_backend() {
    print_info "启动后端服务..."
    
    if run_ssh_command "pm2 describe audioediter-backend >/dev/null 2>&1"; then
        print_warning "后端服务已在运行"
        return 0
    fi
    
    run_ssh_command "cd $DEPLOY_PATH && pm2 start ecosystem.config.js"
    run_ssh_command "pm2 save"
    print_success "后端服务启动完成"
}

# 停止后端服务
stop_backend() {
    print_info "停止后端服务..."
    
    if ! run_ssh_command "pm2 describe audioediter-backend >/dev/null 2>&1"; then
        print_warning "后端服务未运行"
        return 0
    fi
    
    run_ssh_command "pm2 stop audioediter-backend"
    print_success "后端服务停止完成"
}

# 重启后端服务
restart_backend() {
    print_info "重启后端服务..."
    
    if run_ssh_command "pm2 describe audioediter-backend >/dev/null 2>&1"; then
        run_ssh_command "pm2 restart audioediter-backend"
    else
        run_ssh_command "cd $DEPLOY_PATH && pm2 start ecosystem.config.js"
    fi
    
    run_ssh_command "pm2 save"
    print_success "后端服务重启完成"
}

# 重启Nginx
restart_nginx() {
    print_info "重启Nginx..."
    
    if run_ssh_command "nginx -t"; then
        run_ssh_command "systemctl reload nginx"
        print_success "Nginx重启完成"
    else
        print_error "Nginx配置测试失败"
        exit 1
    fi
}

# 显示服务状态
show_status() {
    print_info "服务状态检查..."
    
    echo
    print_info "=== PM2 服务状态 ==="
    run_ssh_command "pm2 list"
    
    echo
    print_info "=== Nginx 状态 ==="
    run_ssh_command "systemctl status nginx --no-pager -l"
    
    echo
    print_info "=== 端口监听状态 ==="
    run_ssh_command "netstat -tlnp | grep -E ':(80|3000|$BACKEND_PORT)' || ss -tlnp | grep -E ':(80|3000|$BACKEND_PORT)'"
    
    echo
    print_info "=== 服务日志 (最近10行) ==="
    run_ssh_command "pm2 logs audioediter-backend --lines 10"
}

# 查看日志
show_logs() {
    local lines=${1:-50}
    print_info "显示后端服务日志 (最近 $lines 行)..."
    run_ssh_command "pm2 logs audioediter-backend --lines $lines"
}

# 部署并重启服务
deploy_and_restart() {
    print_info "部署并重启服务..."
    
    # 运行部署脚本
    ./deploy-with-config.sh
    
    print_success "部署并重启完成"
}

# 显示帮助信息
show_help() {
    echo "音频编辑器服务管理脚本"
    echo
    echo "用法: $0 [命令]"
    echo
    echo "命令:"
    echo "  start     启动后端服务"
    echo "  stop      停止后端服务"
    echo "  restart   重启后端服务"
    echo "  nginx     重启Nginx"
    echo "  status    显示服务状态"
    echo "  logs [n]  查看后端日志 (默认50行)"
    echo "  deploy    部署并重启服务"
    echo "  help      显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 start          # 启动服务"
    echo "  $0 restart        # 重启服务"
    echo "  $0 logs 100       # 查看最近100行日志"
    echo "  $0 status         # 查看服务状态"
}

# 主函数
main() {
    check_config
    
    case "${1:-help}" in
        "start")
            start_backend
            ;;
        "stop")
            stop_backend
            ;;
        "restart")
            restart_backend
            ;;
        "nginx")
            restart_nginx
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "deploy")
            deploy_and_restart
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
