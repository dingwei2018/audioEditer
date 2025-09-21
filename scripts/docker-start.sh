#!/bin/bash

# 音频编辑器云端 API 服务启动脚本
# 使用云端 TTS 服务，无需本地模型部署

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_header() {
    echo -e "\033[1;34m[HEADER]\033[0m $1"
}

log_header "☁️ 启动音频编辑器云端 API 服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
    log_success "Docker 环境检查通过"
}

# 检查环境配置文件
check_env_config() {
    if [ ! -f ".env.cloud" ]; then
        log_warning "未找到 .env.cloud 配置文件"
        log_info "创建示例配置文件..."
        
        cat > .env.cloud << EOF
# 云端 API 配置
COSYVOICE_CLOUD_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech
COSYVOICE_API_KEY=your_cosyvoice_api_key_here
COSYVOICE_MODEL_ID=sambert-zhichu-v1

GPT_SOVITS_CLOUD_API_URL=https://api.example.com/gpt-sovits/v1
GPT_SOVITS_API_KEY=your_gpt_sovits_api_key_here
GPT_SOVITS_MODEL_ID=gpt-sovits-zh

# 本地服务配置
MYSQL_ROOT_PASSWORD=audioediter_root
MYSQL_DATABASE=audioediter
MYSQL_USER=audioediter
MYSQL_PASSWORD=audioediter_pass

# API 配置
TTS_API_TIMEOUT=30000
TTS_API_RETRY_COUNT=3
LOG_LEVEL=info
EOF
        
        log_warning "请编辑 .env.cloud 文件，配置你的 API 密钥"
        echo ""
        read -p "配置完成后按回车继续..."
    fi

    # 加载环境变量
    if [ -f ".env.cloud" ]; then
        export $(grep -v '^#' .env.cloud | xargs)
        log_info "已加载云端 API 配置"
    fi
}

# 检查 API 配置
check_api_config() {
    log_info "检查 API 配置..."
    
    local cosyvoice_configured=false
    local gpt_sovits_configured=false

    # 检查 CosyVoice API 配置
    if [ -n "$COSYVOICE_API_KEY" ] && [ "$COSYVOICE_API_KEY" != "your_cosyvoice_api_key_here" ]; then
        log_success "✅ CosyVoice API 已配置"
        cosyvoice_configured=true
    else
        log_warning "⚠️ CosyVoice API 未配置"
    fi

    # 检查 GPT-SoVITS API 配置
    if [ -n "$GPT_SOVITS_API_KEY" ] && [ "$GPT_SOVITS_API_KEY" != "your_gpt_sovits_api_key_here" ]; then
        log_success "✅ GPT-SoVITS API 已配置"
        gpt_sovits_configured=true
    else
        log_warning "⚠️ GPT-SoVITS API 未配置"
    fi

    if [ "$cosyvoice_configured" = false ] && [ "$gpt_sovits_configured" = false ]; then
        log_error "至少需要配置一个 TTS 服务的 API 密钥"
        log_info "请编辑 .env.cloud 文件并设置正确的 API 密钥"
        exit 1
    fi

    log_success "API 配置检查完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p uploads temp logs
    
    log_success "目录创建完成"
}

# 构建 Docker 镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    if docker-compose build; then
        log_success "Docker 镜像构建成功"
    else
        log_error "Docker 镜像构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    if docker-compose up -d; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    local services=("backend" "frontend" "mysql" "redis" "nginx" "tts-proxy")
    
    for service in "${services[@]}"; do
        log_info "等待 $service 服务启动..."
        local count=0
        local max_attempts=30
        
        while [ $count -lt $max_attempts ]; do
            if docker-compose ps | grep -q "${service}.*Up"; then
                log_success "$service 服务已启动"
                break
            fi
            
            sleep 2
            count=$((count + 1))
        done
        
        if [ $count -eq $max_attempts ]; then
            log_warning "$service 服务启动超时"
        fi
    done
}

# 显示服务状态
show_status() {
    log_header "📊 服务状态"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 检查服务状态
    local services=("backend" "frontend" "mysql" "redis" "nginx" "tts-proxy")
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "${service}.*Up"; then
            log_success "✅ $service 服务运行正常"
        else
            log_error "❌ $service 服务未运行"
        fi
    done
    
    echo ""
    log_info "🌐 访问地址："
    echo "  前端应用: http://localhost:80"
    echo "  后端 API: http://localhost:80/api"
    echo "  健康检查: http://localhost:80/health"
    echo "  TTS 代理: http://localhost:8001"
    
    echo ""
    log_info "🔧 管理命令："
    echo "  查看服务状态: docker-compose ps"
    echo "  查看服务日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
}

# 主函数
main() {
    check_docker
    check_env_config
    check_api_config
    create_directories
    build_images
    start_services
    wait_for_services
    show_status
    
    echo ""
    log_success "🎉 音频编辑器云端 API 服务启动完成！"
    echo ""
    log_info "💡 提示："
    echo "  - 如需修改 API 配置，请编辑 .env.cloud 文件"
    echo "  - 使用 docker-compose restart 重启服务"
    echo "  - 查看详细日志: docker-compose logs -f [服务名]"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 执行主函数
main "$@"