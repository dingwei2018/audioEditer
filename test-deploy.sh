#!/bin/bash

# 测试部署脚本的菜单显示

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
print_header() { echo -e "${PURPLE}[HEADER]${NC} $1"; }
print_option() { echo -e "${CYAN}[OPTION]${NC} $1"; }

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/scripts/deploy"

echo "脚本目录: $SCRIPT_DIR"
echo "部署目录: $DEPLOY_DIR"
echo

# 检查部署目录
if [[ -d "$DEPLOY_DIR" ]]; then
    echo "部署目录存在"
    ls -la "$DEPLOY_DIR"
else
    echo "部署目录不存在"
    exit 1
fi

echo
echo "=================================="
echo "    🚀 音频编辑器部署系统 🚀"
echo "=================================="
echo

print_info "欢迎使用音频编辑器部署系统！"
print_info "请选择您需要的部署方式："
echo

# 显示部署选项
local options=()
local descriptions=()

# 检查可用的部署脚本
if [[ -f "$DEPLOY_DIR/deploy-simple.sh" ]]; then
    options+=("deploy-simple.sh")
    descriptions+=("简单部署 - 快速部署前端，适合开发环境")
fi

if [[ -f "$DEPLOY_DIR/deploy-with-config.sh" ]]; then
    options+=("deploy-with-config.sh")
    descriptions+=("配置部署 - 使用配置文件，支持完整环境检查")
fi

if [[ -f "$DEPLOY_DIR/deploy-euleros.sh" ]]; then
    options+=("deploy-euleros.sh")
    descriptions+=("华为云EulerOS专用 - 针对华为云EulerOS系统优化")
fi

if [[ -f "$DEPLOY_DIR/install-nodejs-euleros.sh" ]]; then
    options+=("install-nodejs-euleros.sh")
    descriptions+=("Node.js安装 - 专门为EulerOS安装Node.js")
fi

if [[ -f "$DEPLOY_DIR/check-huawei-cloud.sh" ]]; then
    options+=("check-huawei-cloud.sh")
    descriptions+=("华为云检查 - 检查华为云配置和网络状态")
fi

echo "找到 ${#options[@]} 个脚本"
echo

# 显示选项
local index=1
for i in "${!options[@]}"; do
    print_option "$index) ${descriptions[$i]}"
    echo "   脚本: ${options[$i]}"
    echo
    ((index++))
done

# 添加退出选项
print_option "$index) 退出"
echo

echo "测试完成"
