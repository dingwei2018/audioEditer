#!/bin/bash

# 华为云EulerOS Node.js安装脚本
# 专门针对EulerOS系统的Node.js安装

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 检测系统信息
detect_system() {
    print_info "检测系统信息..."
    
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        print_info "操作系统: $NAME $VERSION"
        print_info "系统ID: $ID"
        print_info "版本ID: $VERSION_ID"
    else
        print_error "无法检测系统信息"
        exit 1
    fi
}

# 检查Node.js是否已安装
check_existing_nodejs() {
    if command -v node >/dev/null 2>&1; then
        local current_version=$(node --version)
        print_info "检测到已安装的Node.js版本: $current_version"
        
        # 检查版本号
        local version_num=$(echo "$current_version" | tr -d 'v' | cut -d'.' -f1)
        if [[ $version_num -ge 14 ]]; then
            print_success "Node.js版本满足要求，无需重新安装"
            return 0
        else
            print_warning "当前Node.js版本过低，需要升级"
            return 1
        fi
    else
        print_info "未检测到Node.js安装"
        return 1
    fi
}

# 方法1: 使用系统包管理器安装
install_with_yum() {
    print_info "尝试使用yum安装Node.js..."
    
    # 更新包列表
    yum update -y
    
    # 安装Node.js和npm
    if yum install -y nodejs npm; then
        print_success "使用yum安装成功"
        return 0
    else
        print_warning "yum安装失败"
        return 1
    fi
}

# 方法2: 使用NodeSource仓库安装
install_with_nodesource() {
    print_info "尝试使用NodeSource仓库安装Node.js..."
    
    # 下载并运行NodeSource安装脚本
    if curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -; then
        print_info "NodeSource仓库配置成功"
        if yum install -y nodejs npm; then
            print_success "使用NodeSource仓库安装成功"
            return 0
        else
            print_warning "NodeSource仓库安装失败"
            return 1
        fi
    else
        print_warning "NodeSource仓库配置失败"
        return 1
    fi
}

# 方法3: 使用二进制包安装
install_with_binary() {
    print_info "尝试使用二进制包安装Node.js..."
    
    # 下载Node.js二进制包
    local node_version="18.17.0"
    local arch=$(uname -m)
    
    case "$arch" in
        "x86_64")
            local download_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.xz"
            ;;
        "aarch64")
            local download_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-arm64.tar.xz"
            ;;
        *)
            print_error "不支持的架构: $arch"
            return 1
            ;;
    esac
    
    print_info "下载Node.js v${node_version} for $arch..."
    
    # 创建临时目录
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # 下载并解压
    if curl -fsSL "$download_url" -o "node.tar.xz" && \
       tar -xf "node.tar.xz" && \
       cd "node-v${node_version}-linux-${arch}"; then
        
        # 复制文件到系统目录
        cp -r bin/* /usr/local/bin/
        cp -r lib/* /usr/local/lib/
        cp -r include/* /usr/local/include/
        cp -r share/* /usr/local/share/
        
        # 清理临时文件
        cd /
        rm -rf "$temp_dir"
        
        print_success "使用二进制包安装成功"
        return 0
    else
        print_warning "二进制包安装失败"
        rm -rf "$temp_dir"
        return 1
    fi
}

# 方法4: 使用NVM安装
install_with_nvm() {
    print_info "尝试使用NVM安装Node.js..."
    
    # 安装NVM
    if curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash; then
        # 加载NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        # 安装最新LTS版本的Node.js
        if nvm install --lts && nvm use --lts; then
            print_success "使用NVM安装成功"
            return 0
        else
            print_warning "NVM安装Node.js失败"
            return 1
        fi
    else
        print_warning "NVM安装失败"
        return 1
    fi
}

# 验证安装
verify_installation() {
    print_info "验证安装..."
    
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        print_success "Node.js安装成功: $node_version"
        print_success "npm安装成功: $npm_version"
        
        # 测试Node.js功能
        if node -e "console.log('Node.js运行正常')"; then
            print_success "Node.js功能测试通过"
        else
            print_warning "Node.js功能测试失败"
        fi
        
        return 0
    else
        print_error "安装验证失败"
        return 1
    fi
}

# 主安装函数
main() {
    echo "=================================="
    echo "   华为云EulerOS Node.js安装脚本"
    echo "=================================="
    echo
    
    # 检查root权限
    check_root
    
    # 检测系统
    detect_system
    
    # 检查现有安装
    if check_existing_nodejs; then
        exit 0
    fi
    
    print_info "开始安装Node.js..."
    echo
    
    # 尝试不同的安装方法
    local install_methods=(
        "install_with_yum"
        "install_with_nodesource" 
        "install_with_binary"
        "install_with_nvm"
    )
    
    for method in "${install_methods[@]}"; do
        print_info "尝试安装方法: $method"
        if $method; then
            if verify_installation; then
                print_success "Node.js安装完成！"
                echo
                print_info "安装信息:"
                echo "Node.js版本: $(node --version)"
                echo "npm版本: $(npm --version)"
                echo "安装路径: $(which node)"
                echo
                exit 0
            fi
        fi
        echo
    done
    
    print_error "所有安装方法都失败了"
    print_info "请尝试手动安装Node.js:"
    print_info "1. 访问 https://nodejs.org/ 下载适合您系统的版本"
    print_info "2. 或联系系统管理员获取帮助"
    exit 1
}

# 错误处理
trap 'print_error "安装过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"
