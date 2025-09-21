#!/bin/bash

# 音频编辑器云端 API 服务测试脚本

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

# 测试服务连通性
test_service_connectivity() {
    local service_name=$1
    local url=$2
    
    log_info "测试 $service_name 连通性..."
    
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        log_success "$service_name 连通性测试通过"
        return 0
    else
        log_error "$service_name 连通性测试失败"
        return 1
    fi
}

# 测试 TTS API 服务
test_tts_service() {
    local service_name=$1
    local base_url=$2
    
    log_info "测试 $service_name API 服务..."
    
    # 测试健康检查端点
    local health_url="$base_url/health"
    if curl -s --max-time 10 "$health_url" > /dev/null 2>&1; then
        log_success "$service_name 健康检查通过"
    else
        log_error "$service_name 健康检查失败"
        return 1
    fi
    
    # 测试 API 响应
    local response=$(curl -s --max-time 10 "$health_url" 2>/dev/null || echo "")
    if [ -n "$response" ]; then
        log_success "$service_name API 响应正常"
        echo "  响应内容: $response"
    else
        log_warning "$service_name API 响应为空"
    fi
    
    echo ""
}

# 测试 Nginx 代理
test_nginx_proxy() {
    log_info "测试 Nginx 代理服务..."
    
    local endpoints=(
        "http://localhost:80"
        "http://localhost:80/health"
        "http://localhost:80/api"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 10 "$endpoint" > /dev/null 2>&1; then
            log_success "Nginx 代理 $endpoint 正常"
        else
            log_warning "Nginx 代理 $endpoint 异常"
        fi
    done
    echo ""
}

# 测试数据库连接
test_database_connection() {
    log_info "测试数据库连接..."
    
    # 检查 MySQL 容器状态
    if docker-compose ps mysql | grep -q "Up"; then
        log_success "MySQL 容器运行正常"
        
        # 尝试连接数据库
        if docker-compose exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-audioediter_root}" -e "SELECT 1;" > /dev/null 2>&1; then
            log_success "MySQL 数据库连接正常"
        else
            log_warning "MySQL 数据库连接失败"
        fi
    else
        log_error "MySQL 容器未运行"
    fi
    
    # 检查 Redis 容器状态
    if docker-compose ps redis | grep -q "Up"; then
        log_success "Redis 容器运行正常"
        
        # 尝试连接 Redis
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            log_success "Redis 连接正常"
        else
            log_warning "Redis 连接失败"
        fi
    else
        log_error "Redis 容器未运行"
    fi
    echo ""
}

# 测试 API 功能
test_api_functionality() {
    log_info "测试 API 功能..."
    
    # 测试后端 API
    if test_service_connectivity "后端 API" "http://localhost:3000/health"; then
        # 测试具体的 API 端点
        local api_endpoints=(
            "http://localhost:3000/health"
            "http://localhost:3000/api/health"
        )
        
        for endpoint in "${api_endpoints[@]}"; do
            if curl -s --max-time 10 "$endpoint" > /dev/null 2>&1; then
                log_success "API 端点 $endpoint 正常"
            else
                log_warning "API 端点 $endpoint 异常"
            fi
        done
    fi
    
    # 测试 TTS 代理 API
    if test_service_connectivity "TTS 代理" "http://localhost:8001/health"; then
        log_success "TTS 代理 API 正常"
    fi
    
    echo ""
}

# 显示测试结果摘要
show_test_summary() {
    log_header "📊 测试结果摘要"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total_tests=0
    local passed_tests=0
    
    # 统计测试结果
    local services=("frontend" "backend" "nginx" "mysql" "redis" "tts-proxy")
    
    for service in "${services[@]}"; do
        total_tests=$((total_tests + 1))
        if docker-compose ps | grep -q "${service}.*Up"; then
            passed_tests=$((passed_tests + 1))
            log_success "✅ $service 服务正常"
        else
            log_error "❌ $service 服务异常"
        fi
    done
    
    echo ""
    log_info "测试统计: $passed_tests/$total_tests 服务正常"
    
    if [ $passed_tests -eq $total_tests ]; then
        log_success "🎉 所有服务测试通过！"
    else
        log_warning "⚠️ 部分服务存在问题，请检查日志"
    fi
    
    echo ""
    log_info "🔧 故障排除："
    echo "  查看服务日志: docker-compose logs -f [服务名]"
    echo "  重启服务: docker-compose restart [服务名]"
    echo "  重新启动: ./scripts/docker-start.sh"
}

# 主函数
main() {
    log_header "🧪 音频编辑器云端 API 服务测试"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，无法执行测试"
        exit 1
    fi
    
    # 检查服务是否启动
    if ! docker-compose ps | grep -q "Up"; then
        log_warning "服务未启动，请先运行 ./scripts/docker-start.sh"
        exit 1
    fi
    
    # 执行各项测试
    test_database_connection
    test_nginx_proxy
    test_api_functionality
    test_tts_service "TTS 代理" "http://localhost:8001"
    
    show_test_summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 执行主函数
main "$@"