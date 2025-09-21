#!/bin/bash

# 音频编辑器 Docker 服务停止脚本

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

# 停止服务
stop_services() {
    log_info "停止 TTS 服务..."
    
    # 切换到项目根目录
    cd "$(dirname "$0")/.."
    
    # 停止所有服务
    docker-compose down
    
    log_success "服务已停止"
}

# 清理资源（可选）
cleanup_resources() {
    if [ "${1:-}" = "--cleanup" ]; then
        log_info "清理 Docker 资源..."
        
        # 停止并删除容器
        docker-compose down --volumes --remove-orphans
        
        # 删除镜像（可选）
        if [ "${2:-}" = "--remove-images" ]; then
            log_warning "删除 Docker 镜像..."
            docker-compose down --rmi all
        fi
        
        # 清理未使用的资源
        docker system prune -f
        
        log_success "资源清理完成"
    fi
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h          显示帮助信息"
    echo "  --cleanup           停止服务并清理卷和孤儿容器"
    echo "  --remove-images     停止服务并删除所有相关镜像"
    echo ""
}

# 主函数
main() {
    echo "🛑 停止音频编辑器 TTS 服务"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --cleanup)
            stop_services
            cleanup_resources --cleanup
            ;;
        --remove-images)
            stop_services
            cleanup_resources --cleanup --remove-images
            ;;
        *)
            stop_services
            ;;
    esac

    echo ""
    log_success "操作完成！"
}

# 运行主函数
main "$@"

