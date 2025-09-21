#!/bin/bash

# 音频编辑器部署脚本 - 简化菜单版本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_option() { echo -e "${CYAN}[OPTION]${NC} $1"; }

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/scripts/deploy"

# 显示菜单
show_menu() {
    echo "=================================="
    echo "    🚀 音频编辑器部署系统 🚀"
    echo "=================================="
    echo
    print_info "欢迎使用音频编辑器部署系统！"
    print_info "请选择您需要的部署方式："
    echo
    
    print_option "1) 简单部署 - 快速部署前端，适合开发环境"
    echo "   脚本: deploy-simple.sh"
    echo
    
    print_option "2) 配置部署 - 使用配置文件，支持完整环境检查"
    echo "   脚本: deploy-with-config.sh"
    echo
    
    print_option "3) 华为云EulerOS专用 - 针对华为云EulerOS系统优化"
    echo "   脚本: deploy-euleros.sh"
    echo
    
    print_option "4) Node.js安装 - 专门为EulerOS安装Node.js"
    echo "   脚本: install-nodejs-euleros.sh"
    echo
    
    print_option "5) 华为云检查 - 检查华为云配置和网络状态"
    echo "   脚本: check-huawei-cloud.sh"
    echo
    
    print_option "6) 退出"
    echo
}

# 获取用户选择
get_choice() {
    while true; do
        echo -n "请输入您的选择 (1-6): " >&2
        read choice
        
        # 去除可能的空白字符
        choice=$(echo "$choice" | tr -d '[:space:]')
        
        if [[ "$choice" =~ ^[1-6]$ ]]; then
            printf "%s" "$choice"
            return 0
        else
            echo -e "${RED}[ERROR]${NC} 请输入 1 到 6 之间的数字" >&2
            echo >&2
        fi
    done
}

# 执行选择的脚本
run_script() {
    local choice=$1
    
    case "$choice" in
        1)
            local script="$DEPLOY_DIR/deploy-simple.sh"
            ;;
        2)
            local script="$DEPLOY_DIR/deploy-with-config.sh"
            ;;
        3)
            local script="$DEPLOY_DIR/deploy-euleros.sh"
            ;;
        4)
            local script="$DEPLOY_DIR/install-nodejs-euleros.sh"
            ;;
        5)
            local script="$DEPLOY_DIR/check-huawei-cloud.sh"
            ;;
        6)
            print_info "感谢使用，再见！"
            exit 0
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} 无效的选择"
            exit 1
            ;;
    esac
    
    if [[ ! -f "$script" ]]; then
        echo -e "${RED}[ERROR]${NC} 脚本不存在: $script"
        exit 1
    fi
    
    print_info "正在执行: $(basename "$script")"
    echo "=================================="
    echo
    
    chmod +x "$script"
    bash "$script"
}

# 检查配置文件
check_config() {
    if [[ ! -f "deploy.config" ]]; then
        echo -e "${YELLOW}[WARNING]${NC} 未找到配置文件 deploy.config"
        print_info "某些部署脚本可能需要此配置文件"
        print_info "您可以使用 deploy.config.example 作为模板创建配置文件"
        echo
    fi
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            echo "用法: $0"
            echo
            echo "音频编辑器部署脚本"
            echo "运行时会显示菜单供您选择部署方式"
            echo
            exit 0
            ;;
        -l|--list)
            echo "可用的部署脚本:"
            echo "1) deploy-simple.sh"
            echo "2) deploy-with-config.sh"
            echo "3) deploy-euleros.sh"
            echo "4) install-nodejs-euleros.sh"
            echo "5) check-huawei-cloud.sh"
            exit 0
            ;;
        *)
            # 默认进入交互模式
            check_config
            show_menu
            local choice
            choice=$(get_choice)
            run_script "$choice"
            ;;
    esac
}

# 检查部署目录
if [[ ! -d "$DEPLOY_DIR" ]]; then
    echo -e "${RED}[ERROR]${NC} 部署脚本目录不存在: $DEPLOY_DIR"
    exit 1
fi

# 执行主函数
main "$@"
