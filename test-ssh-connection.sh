#!/bin/bash

# SSH连接测试脚本
# 用于诊断SSH连接问题

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

echo "=================================="
echo "    SSH连接测试工具"
echo "=================================="
echo

# 检查配置文件
if [[ ! -f "deploy.config" ]]; then
    print_error "配置文件 deploy.config 不存在"
    print_info "请先创建配置文件"
    exit 1
fi

print_info "加载配置文件..."
source deploy.config

print_info "当前配置信息:"
echo "服务器IP: $SERVER_IP"
echo "SSH用户: $SSH_USER"
echo "SSH端口: ${SSH_PORT:-22}"
echo "=================================="
echo

# 检查必要的工具
print_info "检查必要的工具..."

if command -v ssh &> /dev/null; then
    print_success "SSH客户端已安装"
else
    print_error "SSH客户端未安装"
    exit 1
fi

if command -v sshpass &> /dev/null; then
    print_success "sshpass已安装"
    USE_SSHPASS=true
else
    print_warning "sshpass未安装，将使用交互式SSH"
    print_info "安装sshpass: brew install hudochenkov/sshpass/sshpass"
    USE_SSHPASS=false
fi

echo

# 测试网络连通性
print_info "测试网络连通性..."
if ping -c 3 "$SERVER_IP" >/dev/null 2>&1; then
    print_success "服务器IP可达: $SERVER_IP"
else
    print_error "服务器IP不可达: $SERVER_IP"
    print_info "请检查:"
    print_info "1. 服务器IP地址是否正确"
    print_info "2. 网络连接是否正常"
    print_info "3. 服务器是否在线"
    exit 1
fi

echo

# 测试端口连通性
print_info "测试SSH端口连通性..."
port=${SSH_PORT:-22}
if nc -zv "$SERVER_IP" "$port" 2>/dev/null; then
    print_success "SSH端口 $port 可访问"
else
    print_error "SSH端口 $port 不可访问"
    print_info "请检查:"
    print_info "1. SSH服务是否在运行"
    print_info "2. 防火墙是否阻止了SSH端口"
    print_info "3. 端口号是否正确"
    exit 1
fi

echo

# 测试SSH连接
print_info "测试SSH连接..."

if [[ $USE_SSHPASS == true ]]; then
    print_info "使用sshpass进行非交互式连接测试..."
    if sshpass -p "$SSH_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "${SSH_PORT:-22}" "$SSH_USER@$SERVER_IP" "echo 'SSH连接测试成功'"; then
        print_success "SSH连接测试成功！"
    else
        print_error "SSH连接测试失败"
        echo
        print_info "可能的问题:"
        print_info "1. 用户名或密码错误"
        print_info "2. SSH服务配置问题"
        print_info "3. 服务器安全设置阻止了连接"
        echo
        print_info "手动测试命令:"
        echo "ssh -p ${SSH_PORT:-22} $SSH_USER@$SERVER_IP"
        exit 1
    fi
else
    print_info "使用交互式SSH连接测试..."
    print_warning "请手动输入密码进行连接测试"
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "${SSH_PORT:-22}" "$SSH_USER@$SERVER_IP" "echo 'SSH连接测试成功'"; then
        print_success "SSH连接测试成功！"
    else
        print_error "SSH连接测试失败"
        echo
        print_info "可能的问题:"
        print_info "1. 用户名或密码错误"
        print_info "2. SSH服务配置问题"
        print_info "3. 服务器安全设置阻止了连接"
        exit 1
    fi
fi

echo
print_success "所有测试通过！SSH连接配置正确。"
