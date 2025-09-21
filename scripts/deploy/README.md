# 部署脚本说明

本目录包含了音频编辑器的各种部署脚本，每个脚本针对不同的部署场景和系统环境。

## 脚本列表

### 1. deploy-simple.sh
**简单部署脚本**
- 适用于：开发环境、快速部署
- 功能：快速部署前端项目
- 特点：配置简单，部署速度快

### 2. deploy-with-config.sh
**配置化部署脚本**
- 适用于：生产环境、完整部署
- 功能：支持前端和后端部署，包含环境检查
- 特点：
  - 使用 `deploy.config` 配置文件
  - 自动检查服务器环境
  - 支持Node.js、PM2、Nginx自动安装配置
  - 包含防火墙配置

### 3. deploy-euleros.sh
**华为云EulerOS专用部署脚本**
- 适用于：华为云EulerOS系统
- 功能：针对EulerOS系统优化的部署流程
- 特点：
  - 特殊处理EulerOS系统的Node.js安装
  - 优化的Nginx配置
  - 简化的部署流程

### 4. install-nodejs-euleros.sh
**EulerOS Node.js安装脚本**
- 适用于：华为云EulerOS系统
- 功能：专门为EulerOS系统安装Node.js
- 特点：
  - 多种安装方法（yum、二进制包、NVM等）
  - 自动检测系统版本
  - 支持不同架构（x86_64、aarch64）

### 5. check-huawei-cloud.sh
**华为云配置检查脚本**
- 适用于：华为云环境诊断
- 功能：检查华为云配置和网络状态
- 特点：
  - DNS解析检查
  - 端口连通性测试
  - 服务状态检查
  - 提供解决建议

## 使用方法

### 通过主入口脚本使用（推荐）
```bash
# 从项目根目录运行
./deploy.sh

# 列出所有可用脚本
./deploy.sh --list

# 自动选择脚本
./deploy.sh --auto

# 直接指定脚本编号
./deploy.sh 1
```

### 直接运行脚本
```bash
# 进入脚本目录
cd scripts/deploy

# 运行特定脚本
./deploy-euleros.sh
```

## 配置文件

### deploy.config
部署配置文件，包含以下配置项：
- 服务器信息（IP、用户名、密码等）
- 部署路径和模块
- 服务配置（端口、域名等）
- 数据库配置

## 系统要求

### 本地环境
- macOS/Linux系统
- Bash shell
- sshpass（用于非交互式SSH连接）
- rsync
- curl

### 目标服务器
- Linux系统（推荐CentOS/RHEL/EulerOS）
- 网络连接
- 适当的权限（推荐root用户）

## 安装sshpass

### macOS
```bash
brew install hudochenkov/sshpass/sshpass
```

### Ubuntu/Debian
```bash
sudo apt-get install sshpass
```

### CentOS/RHEL
```bash
sudo yum install sshpass
```

## 故障排除

### 常见问题

1. **SSH连接失败**
   - 检查服务器IP和端口
   - 确认用户名和密码正确
   - 检查网络连接

2. **Node.js安装失败**
   - 使用专门的Node.js安装脚本
   - 检查系统版本兼容性
   - 手动安装Node.js

3. **Nginx配置错误**
   - 检查配置文件语法
   - 确认端口未被占用
   - 检查防火墙设置

4. **域名无法访问**
   - 使用检查脚本诊断问题
   - 检查DNS解析
   - 验证Nginx配置

### 获取帮助
```bash
./deploy.sh --help
```

## 脚本开发

如需添加新的部署脚本：

1. 在 `scripts/deploy/` 目录下创建新脚本
2. 确保脚本有执行权限
3. 主入口脚本会自动检测并添加新脚本到选项列表

## 更新日志

- 2025-09-21: 重构脚本组织结构，创建主入口脚本
- 2025-09-21: 添加华为云EulerOS专用支持
- 2025-09-21: 优化Node.js安装流程
