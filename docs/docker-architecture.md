# 🏗️ Docker 架构文档

## 📋 概述

本文档详细说明了音频编辑器项目的 Docker 容器化架构，实现了完整的前后端分离架构，使用云端 API 服务替代本地模型部署。

## 🎯 架构特点

- **云端优先**: 使用云端 TTS API 服务，无需本地模型部署
- **微服务架构**: 各服务独立部署，易于扩展和维护
- **容器化部署**: 所有服务运行在 Docker 容器中
- **统一代理**: 使用 Nginx 作为反向代理，提供统一访问入口
- **数据持久化**: 数据库和缓存数据持久化存储

## 🏛️ 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx 反向代理 (80)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│ 前端应用 │    │   后端 API   │    │ TTS API代理  │
│ (5173)  │    │   (3000)    │    │   (8001)    │
└─────────┘    └─────────────┘    └─────────────┘
                      │                 │
                      ▼                 │
              ┌─────────────┐          │
              │   MySQL     │          │
              │   (3306)    │          │
              └─────────────┘          │
                      │                 │
                      ▼                 │
              ┌─────────────┐          │
              │   Redis     │          │
              │   (6379)    │          │
              └─────────────┘          │
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   云端 API      │
                              │ CosyVoice API  │
                              │ GPT-SoVITS API │
                              └─────────────────┘
```

## 🐳 容器服务

### 1. 前端服务 (Frontend)
- **镜像**: 基于 Node.js 18 构建
- **端口**: 5173
- **功能**: Vue 3 单页应用
- **特性**: 
  - 开发环境热重载
  - 生产环境优化构建
  - 静态资源服务

### 2. 后端服务 (Backend)
- **镜像**: 基于 Node.js 18 构建
- **端口**: 3000
- **功能**: Fastify API 服务器
- **特性**:
  - RESTful API 接口
  - WebSocket 支持
  - 云端 API 集成

### 3. TTS API 代理服务 (TTS Proxy)
- **镜像**: 基于 Node.js 18 构建
- **端口**: 8001, 8051
- **功能**: 云端 TTS API 代理
- **特性**:
  - 统一 API 接口
  - 请求转发和响应处理
  - 错误处理和重试机制

### 4. MySQL 数据库
- **镜像**: mysql:8.0
- **端口**: 3306
- **功能**: 关系型数据库
- **特性**:
  - 数据持久化
  - 自动初始化
  - 连接池管理

### 5. Redis 缓存
- **镜像**: redis:7-alpine
- **端口**: 6379
- **功能**: 内存缓存和会话存储
- **特性**:
  - 高性能缓存
  - 会话管理
  - 消息队列

### 6. Nginx 反向代理
- **镜像**: nginx:alpine
- **端口**: 80, 443
- **功能**: 反向代理和负载均衡
- **特性**:
  - 统一访问入口
  - SSL 终止
  - 静态文件服务

## 🔧 配置说明

### 环境变量

```bash
# 云端 API 配置
COSYVOICE_CLOUD_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech
COSYVOICE_API_KEY=your_api_key_here
GPT_SOVITS_CLOUD_API_URL=https://api.example.com/gpt-sovits/v1
GPT_SOVITS_API_KEY=your_api_key_here

# 数据库配置
MYSQL_ROOT_PASSWORD=audioediter_root
MYSQL_DATABASE=audioediter
MYSQL_USER=audioediter
MYSQL_PASSWORD=audioediter_pass

# 应用配置
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
```

### 网络配置

- **网络名称**: audio-editor-network
- **网络类型**: bridge
- **服务发现**: 通过服务名进行内部通信

### 存储卷

```yaml
volumes:
  mysql_data:    # MySQL 数据持久化
  redis_data:    # Redis 数据持久化
  uploads:       # 文件上传目录
  temp:          # 临时文件目录
  logs:          # 日志文件目录
```

## 🚀 部署流程

### 1. 环境准备
```bash
# 检查 Docker 环境
docker --version
docker-compose --version

# 创建配置文件
cp config/cloud-api.env.template .env.cloud
# 编辑配置文件，设置 API 密钥
```

### 2. 启动服务
```bash
# 启动所有服务
./scripts/docker-start.sh

# 或使用 docker-compose
docker-compose up -d
```

### 3. 验证部署
```bash
# 检查服务状态
./scripts/docker-status.sh

# 测试服务功能
./scripts/docker-test.sh
```

## 📊 监控和日志

### 服务监控
- **健康检查**: 每个服务都有健康检查端点
- **状态监控**: 通过 `docker-compose ps` 查看服务状态
- **资源监控**: 通过 `docker stats` 查看资源使用情况

### 日志管理
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f tts-proxy

# 查看最近的日志
docker-compose logs --tail=100 -f
```

## 🔒 安全配置

### 网络安全
- **内部通信**: 服务间通过内部网络通信
- **端口暴露**: 仅暴露必要的端口
- **防火墙**: 建议配置防火墙规则

### 数据安全
- **环境变量**: 敏感信息通过环境变量传递
- **数据加密**: 数据库连接使用加密
- **访问控制**: API 密钥管理

## 🔄 扩展和维护

### 水平扩展
- **无状态服务**: 前端、后端、TTS 代理支持水平扩展
- **负载均衡**: Nginx 支持负载均衡配置
- **数据库集群**: MySQL 支持主从复制

### 版本更新
```bash
# 更新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 清理旧镜像
docker image prune
```

### 备份和恢复
```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p audioediter > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p audioediter < backup.sql
```

## 🎯 最佳实践

### 开发环境
- 使用 `docker-compose up` 启动开发环境
- 启用热重载和调试模式
- 使用本地配置文件覆盖默认配置

### 生产环境
- 使用 `docker-compose up -d` 后台运行
- 配置日志轮转和监控
- 设置资源限制和健康检查

### 故障排除
- 检查容器日志: `docker-compose logs`
- 验证网络连接: `docker network ls`
- 检查端口占用: `lsof -i :端口号`

## 📚 相关文档

- [云端 API 集成方案](./cloud-api-integration.md)
- [快速启动指南](./cloud-api-quick-start.md)
- [Docker 部署指南](./docker-setup.md)
- [故障排除指南](./troubleshooting.md)

---

*通过云端 API 架构，实现了轻量化、高可用的音频编辑器服务部署。*