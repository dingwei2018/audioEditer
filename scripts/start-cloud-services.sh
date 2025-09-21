#!/bin/bash

# 云端 API 服务启动脚本
# 使用云端 TTS 服务替代本地部署

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}[HEADER]${NC} $1"
}

log_header "☁️ 启动云端 API 服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker"
    exit 1
fi

log_success "Docker 环境检查通过"

# 检查环境配置文件
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

# 检查必要的环境变量
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_${var_name,,}_api_key_here" ]; then
        log_warning "⚠️ $var_name 未配置或使用默认值"
        return 1
    else
        log_success "✅ $var_name 已配置"
        return 0
    fi
}

log_info "检查 API 配置..."

cosyvoice_configured=false
gpt_sovits_configured=false

if check_env_var "COSYVOICE_API_KEY"; then
    cosyvoice_configured=true
fi

if check_env_var "GPT_SOVITS_API_KEY"; then
    gpt_sovits_configured=true
fi

if [ "$cosyvoice_configured" = false ] && [ "$gpt_sovits_configured" = false ]; then
    log_error "至少需要配置一个 TTS 服务的 API 密钥"
    log_info "请编辑 .env.cloud 文件并设置正确的 API 密钥"
    exit 1
fi

# 创建必要的目录
log_info "创建必要目录..."
mkdir -p uploads temp logs
log_success "目录创建完成"

# 停止现有服务
log_info "停止现有服务..."
docker-compose -f docker-compose-cloud.yml down > /dev/null 2>&1

# 启动云端服务
log_info "启动云端 API 服务..."

if docker-compose -f docker-compose-cloud.yml up -d; then
    log_success "服务启动成功"
else
    log_error "服务启动失败"
    exit 1
fi

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 检查服务状态
log_info "检查服务状态..."

services=("backend" "frontend" "mysql" "redis" "nginx")
if [ "$cosyvoice_configured" = true ] || [ "$gpt_sovits_configured" = true ]; then
    services+=("tts-proxy")
fi

for service in "${services[@]}"; do
    if docker-compose -f docker-compose-cloud.yml ps | grep -q "${service}.*Up"; then
        log_success "✅ $service 服务运行正常"
    else
        log_error "❌ $service 服务未运行"
    fi
done

echo ""
log_header "📊 服务状态总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 显示访问地址
log_info "🌐 访问地址："
echo "  前端应用: http://localhost:80"
echo "  后端 API: http://localhost:80/api"
echo "  健康检查: http://localhost:80/health"

if [ "$cosyvoice_configured" = true ]; then
    echo "  CosyVoice: http://localhost:8001/cosyvoice"
fi

if [ "$gpt_sovits_configured" = true ]; then
    echo "  GPT-SoVITS: http://localhost:8051/gpt-sovits"
fi

echo ""
log_info "🔧 管理命令："
echo "  查看服务状态: docker-compose -f docker-compose-cloud.yml ps"
echo "  查看服务日志: docker-compose -f docker-compose-cloud.yml logs -f"
echo "  停止服务: docker-compose -f docker-compose-cloud.yml down"

echo ""
log_info "📋 API 配置状态："
if [ "$cosyvoice_configured" = true ]; then
    log_success "✅ CosyVoice 云端 API 已配置"
else
    log_warning "⚠️ CosyVoice 云端 API 未配置"
fi

if [ "$gpt_sovits_configured" = true ]; then
    log_success "✅ GPT-SoVITS 云端 API 已配置"
else
    log_warning "⚠️ GPT-SoVITS 云端 API 未配置"
fi

echo ""
log_success "🎉 云端 API 服务启动完成！"
echo ""
log_info "💡 提示："
echo "  - 如需修改 API 配置，请编辑 .env.cloud 文件"
echo "  - 使用 docker-compose -f docker-compose-cloud.yml restart 重启服务"
echo "  - 查看详细日志: docker-compose -f docker-compose-cloud.yml logs -f [服务名]"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
