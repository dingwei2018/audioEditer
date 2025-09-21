#!/bin/bash

# 音频编辑器部署脚本主入口 - 简化版本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_option() { echo -e "${CYAN}[OPTION]${NC} $1"; }

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/scripts/deploy"

# 显示欢迎信息
show_welcome() {
    if [[ -t 1 ]]; then
        clear
    fi
    echo "=================================="
    echo "    🚀 音频编辑器部署系统 🚀"
    echo "=================================="
    echo
    print_info "欢迎使用音频编辑器部署系统！"
    print_info "请选择您需要的部署方式："
    echo
}

# 显示部署选项
show_deploy_options() {
    local index=1
    
    print_option "$index) 简单部署 - 快速部署前端，适合开发环境"
    echo "   脚本: deploy-simple.sh"
    echo
    
    ((index++))
    print_option "$index) 配置部署 - 使用配置文件，支持完整环境检查"
    echo "   脚本: deploy-with-config.sh"
    echo
    
    ((index++))
    print_option "$index) 华为云EulerOS专用 - 针对华为云EulerOS系统优化"
    echo "   脚本: deploy-euleros.sh"
    echo
    
    ((index++))
    print_option "$index) Node.js安装 - 专门为EulerOS安装Node.js"
    echo "   脚本: install-nodejs-euleros.sh"
    echo
    
    ((index++))
    print_option "$index) 华为云检查 - 检查华为云配置和网络状态"
    echo "   脚本: check-huawei-cloud.sh"
    echo
    
    print_option "$index) 退出"
    echo
    
    return 5
}

# 获取用户选择
get_user_choice() {
    local max_options=$1
    
    while true; do
        echo -n "请输入您的选择 (1-$max_options): "
        read -r choice
        
        # 检查输入是否为数字
        if [[ "$choice" =~ ^[0-9]+$ ]]; then
            if [[ "$choice" -ge 1 && "$choice" -le "$max_options" ]]; then
                printf "%s" "$choice"
                return 0
            else
                print_error "请输入 1 到 $max_options 之间的数字"
            fi
        else
            print_error "请输入有效的数字"
        fi
        echo
    done
}

# 执行选择的脚本
execute_script() {
    local choice=$1
    
    # 检查是否为退出选项
    if [[ "$choice" -gt 5 ]]; then
        print_info "感谢使用，再见！"
        exit 0
    fi
    
    # 根据选择确定脚本名称
    local selected_script=""
    case "$choice" in
        1)
            selected_script="deploy-simple.sh"
            ;;
        2)
            selected_script="deploy-with-config.sh"
            ;;
        3)
            selected_script="deploy-euleros.sh"
            ;;
        4)
            selected_script="install-nodejs-euleros.sh"
            ;;
        5)
            selected_script="check-huawei-cloud.sh"
            ;;
        *)
            print_error "无效的选择: $choice"
            exit 1
            ;;
    esac
    
    local script_path="$DEPLOY_DIR/$selected_script"
    
    # 检查脚本是否存在
    if [[ ! -f "$script_path" ]]; then
        print_error "脚本不存在: $script_path"
        exit 1
    fi
    
    print_info "正在执行: $selected_script"
    echo "=================================="
    echo
    
    # 确保脚本有执行权限
    chmod +x "$script_path"
    
    # 执行脚本
    if bash "$script_path" "${@:2}"; then
        echo
        print_success "脚本执行完成！"
    else
        echo
        print_error "脚本执行失败，退出码: $?"
        exit 1
    fi
}

# 检查配置文件
check_config_file() {
    if [[ ! -f "deploy.config" ]]; then
        print_warning "未找到配置文件 deploy.config"
        print_info "某些部署脚本可能需要此配置文件"
        print_info "您可以使用 deploy.config.example 作为模板创建配置文件"
        echo
    fi
}

# 主函数
main() {
    # 解析命令行参数
    case "${1:-}" in
        -h|--help)
            echo "用法: $0 [选项]"
            echo
            echo "选项:"
            echo "  -h, --help     显示此帮助信息"
            echo "  -l, --list     列出所有可用的部署脚本"
            echo
            echo "示例:"
            echo "  $0                    # 交互式选择部署脚本"
            echo "  $0 --list            # 列出所有可用脚本"
            echo "  $0 1                 # 直接选择第一个脚本"
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
        [0-9]*)
            # 直接指定脚本编号
            show_welcome
            check_config_file
            show_deploy_options >/dev/null
            local max_options=5
            if [[ "$1" -ge 1 && "$1" -le $max_options ]]; then
                execute_script "$1" "${@:2}"
            else
                print_error "无效的脚本编号: $1"
                exit 1
            fi
            ;;
        "")
            # 交互式模式
            show_welcome
            check_config_file
            show_deploy_options
            local max_options=5
            local choice
            choice=$(get_user_choice $max_options)
            execute_script "$choice"
            ;;
        *)
            print_error "未知选项: $1"
            echo "使用 $0 --help 查看帮助信息"
            exit 1
            ;;
    esac
}

# 检查脚本目录是否存在
if [[ ! -d "$DEPLOY_DIR" ]]; then
    print_error "部署脚本目录不存在: $DEPLOY_DIR"
    exit 1
fi

# 检查是否有可用的脚本
if ! ls "$DEPLOY_DIR"/*.sh >/dev/null 2>&1; then
    print_error "未找到任何部署脚本"
    exit 1
fi

# 执行主函数
main "$@"
