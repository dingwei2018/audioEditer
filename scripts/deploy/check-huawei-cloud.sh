#!/bin/bash

# 华为云配置检查脚本
# 用于排查域名访问问题

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
DOMAIN="audioediter.iappprogramer.com"
SSH_USER="root"
SSH_PASSWORD="audioediter@2025"

print_info "华为云配置检查脚本"
echo "=================================="

# 1. 检查域名解析
print_info "1. 检查域名解析..."
echo "域名: $DOMAIN"
echo "预期IP: $SERVER_IP"

# 使用多个DNS服务器检查
for dns in "8.8.8.8" "114.114.114.114" "223.5.5.5"; do
    echo -n "DNS $dns: "
    resolved_ip=$(dig @$dns +short $DOMAIN | head -1)
    if [[ "$resolved_ip" == "$SERVER_IP" ]]; then
        print_success "✓ $resolved_ip"
    else
        print_error "✗ $resolved_ip (期望: $SERVER_IP)"
    fi
done

echo

# 2. 检查端口连通性
print_info "2. 检查端口连通性..."
echo -n "HTTP端口80: "
if nc -zv $SERVER_IP 80 2>/dev/null; then
    print_success "✓ 可访问"
else
    print_error "✗ 不可访问"
fi

echo

# 3. 检查HTTP响应
print_info "3. 检查HTTP响应..."
echo "测试IP访问:"
response_ip=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/)
if [[ "$response_ip" == "200" ]]; then
    print_success "✓ IP访问正常 (HTTP $response_ip)"
else
    print_error "✗ IP访问失败 (HTTP $response_ip)"
fi

echo "测试域名访问:"
response_domain=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/)
if [[ "$response_domain" == "200" ]]; then
    print_success "✓ 域名访问正常 (HTTP $response_domain)"
else
    print_error "✗ 域名访问失败 (HTTP $response_domain)"
fi

echo

# 4. 检查服务器配置
print_info "4. 检查服务器配置..."

# 检查Nginx状态
echo -n "Nginx状态: "
if sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "systemctl is-active nginx" 2>/dev/null | grep -q "active"; then
    print_success "✓ 运行中"
else
    print_error "✗ 未运行"
fi

# 检查端口监听
echo -n "端口80监听: "
if sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "netstat -tlnp | grep :80" 2>/dev/null | grep -q ":80"; then
    print_success "✓ 正在监听"
else
    print_error "✗ 未监听"
fi

echo

# 5. 生成诊断报告
print_info "5. 生成诊断报告..."
echo "=================================="
echo "诊断时间: $(date)"
echo "服务器IP: $SERVER_IP"
echo "域名: $DOMAIN"
echo "=================================="

# 6. 提供解决建议
print_info "6. 解决建议..."
echo "如果域名无法访问，请检查以下华为云配置:"
echo
echo "🔧 华为云控制台检查项目:"
echo "1. 安全组规则 - 确保允许HTTP(80)端口入站"
echo "2. 弹性公网IP - 确保EIP已绑定到ECS实例"
echo "3. 域名解析 - 确保A记录指向正确的EIP"
echo "4. CDN/WAF - 如果使用，检查源站配置"
echo "5. 带宽限制 - 检查EIP带宽是否充足"
echo
echo "🌐 DNS传播检查:"
echo "域名解析可能需要几分钟到几小时才能全球生效"
echo "可以使用以下工具检查DNS传播状态:"
echo "- https://www.whatsmydns.net/"
echo "- https://dnschecker.org/"
echo
echo "🔍 浏览器检查:"
echo "1. 清除浏览器缓存和DNS缓存"
echo "2. 尝试使用无痕/隐私模式"
echo "3. 尝试使用不同的浏览器"
echo "4. 检查是否有浏览器扩展阻止访问"

print_success "检查完成！"
