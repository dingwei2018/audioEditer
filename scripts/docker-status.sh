#!/bin/bash

# 音频编辑器云端 API 服务状态检查脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

log_header() {
    echo -e "\033[1;34m[HEADER]\033[0m $1"
}

# 检查服务健康状态
check_service_health() {
    local service_name=$1
    local url=$2
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        log_success "$service_name - 健康"
        return 0
    else
        log_error "$service_name - 不健康"
        return 1
    fi
}

# 获取服务信息
get_service_info() {
    local service_name=$1
    local url=$2
    
    log_info "$service_name 详细信息："
    
    # 尝试获取服务信息
    local response=$(curl -s --max-time 10 "$url/health" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        echo "  URL: $url"
        echo "  状态: $(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "未知")"
        echo "  时间: $(echo "$response" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 || echo "未知")"
    else
        echo "  URL: $url"
        echo "  状态: 无法获取"
    fi
    echo ""
}

# 显示服务状态
show_service_status() {
    echo "🔍 服务状态检查："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 检查前端
    local frontend_healthy=false
    if curl -s --max-time 5 "http://localhost:5173" > /dev/null 2>&1; then
        log_success "前端应用 - 运行中"
        frontend_healthy=true
    else
        log_error "前端应用 - 未运行"
    fi

    # 检查后端
    local backend_healthy=false
    if check_service_health "后端 API" "http://localhost:3000"; then
        backend_healthy=true
    fi

    # 检查 TTS 代理
    local tts_proxy_healthy=false
    if check_service_health "TTS 代理" "http://localhost:8001"; then
        tts_proxy_healthy=true
    fi

    # 检查 Nginx
    local nginx_healthy=false
    if curl -s --max-time 5 "http://localhost:80" > /dev/null 2>&1; then
        log_success "Nginx 代理 - 运行中"
        nginx_healthy=true
    else
        log_error "Nginx 代理 - 未运行"
    fi

    # 显示详细信息
    if [ "$backend_healthy" = true ]; then
        get_service_info "后端 API" "http://localhost:3000"
    fi

    if [ "$tts_proxy_healthy" = true ]; then
        get_service_info "TTS 代理" "http://localhost:8001"
    fi
}

# 显示容器状态
show_container_status() {
    echo "🐳 Docker 容器状态："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 检查 Docker Compose 服务状态
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose ps
    else
        log_warning "docker-compose 命令不可用"
    fi
    echo ""
}

# 显示资源使用情况
show_resource_usage() {
    echo "📊 资源使用情况："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 显示容器资源使用
    if command -v docker >/dev/null 2>&1; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || log_warning "无法获取容器资源使用情况"
    else
        log_warning "Docker 命令不可用"
    fi
    echo ""
}

# 显示网络连接
show_network_info() {
    echo "🌐 网络连接信息："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 检查端口占用
    local ports=("80" "3000" "5173" "3306" "6379" "8001" "8051")
    
    for port in "${ports[@]}"; do
        if lsof -i ":$port" >/dev/null 2>&1; then
            local process=$(lsof -i ":$port" | tail -n +2 | awk '{print $1}' | head -1)
            log_success "端口 $port - 被 $process 占用"
        else
            log_warning "端口 $port - 未被占用"
        fi
    done
    echo ""
}

# 显示访问地址
show_access_urls() {
    echo "🔗 访问地址："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "前端应用: http://localhost:80"
    echo "后端 API: http://localhost:80/api"
    echo "健康检查: http://localhost:80/health"
    echo "TTS 代理: http://localhost:8001"
    echo "API 文档: http://localhost:80/api/docs"
    echo ""
}

# 显示管理命令
show_management_commands() {
    echo "🛠️ 管理命令："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "启动服务: ./scripts/docker-start.sh"
    echo "停止服务: docker-compose down"
    echo "重启服务: docker-compose restart"
    echo "查看日志: docker-compose logs -f"
    echo "查看状态: ./scripts/docker-status.sh"
    echo "测试服务: ./scripts/docker-test.sh"
    echo ""
}

# 主函数
main() {
    log_header "📊 音频编辑器云端 API 服务状态报告"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    show_service_status
    show_container_status
    show_resource_usage
    show_network_info
    show_access_urls
    show_management_commands
    
    log_success "状态检查完成"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 执行主函数
main "$@"