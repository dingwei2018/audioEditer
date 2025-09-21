# 音频编辑器部署指南

本项目提供了多种部署方式，您可以根据需要选择合适的部署脚本。

## 部署脚本说明

### 1. 完整交互式部署脚本 (`deploy.sh`)
**特点**: 功能最全面，支持完整的交互式配置
**适用场景**: 首次部署、复杂环境配置

**使用方法**:
```bash
chmod +x deploy.sh
./deploy.sh
```

**功能特性**:
- 交互式配置所有部署参数
- 自动检测和安装依赖
- 支持备份现有部署
- 自动创建nginx配置
- 支持PM2进程管理
- 完整的错误处理和日志

### 2. 简化部署脚本 (`deploy-simple.sh`)
**特点**: 简单快速，适合快速部署和测试
**适用场景**: 开发测试、快速部署

**使用方法**:
```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

**功能特性**:
- 快速配置基本参数
- 自动构建和同步文件
- 支持前端/后端/全部部署
- 轻量级，依赖最少

### 3. 配置文件部署脚本 (`deploy-with-config.sh`)
**特点**: 使用配置文件，适合重复部署
**适用场景**: 生产环境、重复部署

**使用方法**:
```bash
# 1. 复制配置文件模板
cp deploy.config.example deploy.config

# 2. 编辑配置文件
vim deploy.config

# 3. 运行部署脚本
chmod +x deploy-with-config.sh
./deploy-with-config.sh
```

## 配置文件说明

### deploy.config 配置项

```bash
# 服务器配置
SERVER_IP=192.168.1.100          # 服务器IP地址
SSH_USER=root                    # SSH用户名
SSH_PASSWORD=your_password       # SSH密码
SSH_PORT=22                      # SSH端口

# 部署配置
DEPLOY_PATH=/var/www/audioediter # 部署目录
DEPLOY_ENV=production            # 部署环境
DEPLOY_MODULES=all              # 部署模块: frontend/backend/all

# 服务配置
BACKUP_EXISTING=true            # 是否备份现有部署
RESTART_SERVICES=true           # 是否重启服务

# 端口配置
FRONTEND_PORT=80                # 前端端口
BACKEND_PORT=3000               # 后端端口
```

## 部署前准备

### 本地环境要求
- Node.js 16+ 和 npm
- SSH 客户端
- rsync
- sshpass (可选，用于自动密码认证)

### 服务器环境要求
- Linux 服务器 (Ubuntu/CentOS)
- Node.js 16+ 和 npm
- PM2 (用于进程管理)
- Nginx (用于反向代理)
- 足够的磁盘空间

### 安装服务器依赖
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx
sudo npm install -g pm2

# CentOS/RHEL
sudo yum install nodejs npm nginx
sudo npm install -g pm2
```

## 部署流程

### 1. 选择部署脚本
根据您的需求选择合适的部署脚本：
- **首次部署**: 使用 `deploy.sh`
- **快速测试**: 使用 `deploy-simple.sh`
- **生产环境**: 使用 `deploy-with-config.sh`

### 2. 配置部署参数
- 服务器IP地址
- SSH用户名和密码
- 部署目录
- 部署模块选择
- 环境配置

### 3. 执行部署
运行选定的部署脚本，按照提示完成配置。

### 4. 验证部署
- 检查前端访问: `http://your-server-ip`
- 检查后端API: `http://your-server-ip:3000`
- 查看服务状态: `pm2 status`

## 常见问题

### Q: SSH连接失败
**A**: 检查以下项目：
- 服务器IP地址是否正确
- SSH端口是否正确
- 用户名和密码是否正确
- 服务器是否允许SSH连接
- 防火墙是否阻止连接

### Q: 前端构建失败
**A**: 检查以下项目：
- Node.js版本是否满足要求
- npm依赖是否安装完整
- 是否有足够的磁盘空间
- 网络连接是否正常

### Q: 后端服务启动失败
**A**: 检查以下项目：
- 后端依赖是否安装完整
- 端口是否被占用
- 环境变量是否正确
- 日志文件中的错误信息

### Q: 无法访问前端页面
**A**: 检查以下项目：
- Nginx是否正常运行
- 前端文件是否正确部署
- 防火墙是否开放80端口
- Nginx配置是否正确

## 管理命令

### 查看服务状态
```bash
# 查看PM2进程状态
pm2 status

# 查看后端日志
pm2 logs audioediter-backend

# 查看nginx状态
systemctl status nginx
```

### 重启服务
```bash
# 重启后端服务
pm2 restart audioediter-backend

# 重启nginx
systemctl restart nginx
```

### 更新部署
```bash
# 使用配置文件更新
./deploy-with-config.sh

# 或者使用交互式脚本
./deploy.sh
```

## 安全建议

1. **使用SSH密钥**: 建议使用SSH密钥而不是密码认证
2. **防火墙配置**: 只开放必要的端口
3. **定期备份**: 定期备份部署文件和数据库
4. **更新依赖**: 定期更新Node.js和npm依赖
5. **监控日志**: 定期检查应用和系统日志

## 支持

如果您在部署过程中遇到问题，请：
1. 检查本文档的常见问题部分
2. 查看部署脚本的日志输出
3. 检查服务器的系统日志
4. 联系技术支持团队
