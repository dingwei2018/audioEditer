# 🚀 云端 API 快速启动指南

## 概述

当本地 Docker 部署遇到困难时，可以使用云端 API 服务来快速启动项目。本指南将帮助你在 5 分钟内启动一个完整的音频编辑器服务。

## ⚡ 快速开始

### 步骤 1: 配置 API 密钥

```bash
# 复制配置文件模板
cp .env.cloud.example .env.cloud

# 编辑配置文件，设置你的 API 密钥
nano .env.cloud
```

### 步骤 2: 启动服务

```bash
# 使用云端 API 启动服务
./scripts/start-cloud-services.sh
```

### 步骤 3: 访问应用

- **前端应用**: http://localhost:80
- **API 文档**: http://localhost:80/api/docs
- **健康检查**: http://localhost:80/health

## 🔑 API 密钥获取

### CosyVoice (阿里云)

1. 访问 [阿里云控制台](https://dashscope.console.aliyun.com/)
2. 开通 DashScope 服务
3. 创建 API 密钥
4. 在 `.env.cloud` 中设置：
   ```bash
   COSYVOICE_CLOUD_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech
   COSYVOICE_API_KEY=sk-your-api-key-here
   ```

### GPT-SoVITS (社区服务)

1. 访问 [GPT-SoVITS 社区](https://github.com/RVC-Boss/GPT-SoVITS)
2. 寻找可用的 API 服务
3. 在 `.env.cloud` 中设置：
   ```bash
   GPT_SOVITS_CLOUD_API_URL=https://api.example.com/gpt-sovits/v1
   GPT_SOVITS_API_KEY=your-api-key-here
   ```

## 📋 配置文件说明

### 完整配置示例

```bash
# .env.cloud
# CosyVoice 配置
COSYVOICE_CLOUD_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech
COSYVOICE_API_KEY=sk-your-cosyvoice-api-key
COSYVOICE_MODEL_ID=sambert-zhichu-v1

# GPT-SoVITS 配置
GPT_SOVITS_CLOUD_API_URL=https://api.example.com/gpt-sovits/v1
GPT_SOVITS_API_KEY=your-gpt-sovits-api-key
GPT_SOVITS_MODEL_ID=gpt-sovits-zh

# 本地服务配置
MYSQL_ROOT_PASSWORD=audioediter_root
MYSQL_DATABASE=audioediter
REDIS_URL=redis://redis:6379

# API 配置
TTS_API_TIMEOUT=30000
TTS_API_RETRY_COUNT=3
LOG_LEVEL=info
```

## 🛠️ 服务管理

### 启动服务
```bash
./scripts/start-cloud-services.sh
```

### 查看服务状态
```bash
docker-compose -f docker-compose-cloud.yml ps
```

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose-cloud.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose-cloud.yml logs -f backend
docker-compose -f docker-compose-cloud.yml logs -f tts-proxy
```

### 停止服务
```bash
docker-compose -f docker-compose-cloud.yml down
```

### 重启服务
```bash
docker-compose -f docker-compose-cloud.yml restart
```

## 🧪 测试 API

### 测试 CosyVoice API
```bash
curl -X POST http://localhost:8001/cosyvoice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一个测试",
    "voice": "zhichu",
    "speed": 1.0
  }'
```

### 测试 GPT-SoVITS API
```bash
curl -X POST http://localhost:8051/gpt-sovits/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一个语音克隆测试",
    "voice_clone": true
  }'
```

## 🔧 故障排除

### 常见问题

1. **API 密钥无效**
   ```bash
   # 检查 API 密钥配置
   grep COSYVOICE_API_KEY .env.cloud
   grep GPT_SOVITS_API_KEY .env.cloud
   ```

2. **服务无法启动**
   ```bash
   # 检查 Docker 状态
   docker info
   
   # 检查端口占用
   lsof -i :80
   lsof -i :3000
   ```

3. **API 调用失败**
   ```bash
   # 检查网络连接
   ping dashscope.aliyuncs.com
   
   # 检查服务健康状态
   curl http://localhost:8001/health
   ```

### 日志查看

```bash
# 查看 TTS 代理日志
docker-compose -f docker-compose-cloud.yml logs -f tts-proxy

# 查看后端服务日志
docker-compose -f docker-compose-cloud.yml logs -f backend

# 查看 Nginx 日志
docker-compose -f docker-compose-cloud.yml logs -f nginx
```

## 💰 成本估算

### 阿里云 CosyVoice 定价
- **免费额度**: 每月 1000 次调用
- **超出部分**: 约 ¥0.02/次
- **预估月成本**: 轻度使用 ¥10-50

### GPT-SoVITS 社区服务
- **免费使用**: 大多数社区服务免费
- **限制**: 可能有调用频率限制
- **预估月成本**: ¥0

## 📊 性能对比

| 方案 | 启动时间 | 响应速度 | 稳定性 | 成本 |
|------|----------|----------|--------|------|
| 本地 Docker | 10-30分钟 | 快 | 高 | 免费 |
| 云端 API | 2-5分钟 | 中等 | 高 | 付费 |
| 混合部署 | 5-15分钟 | 快 | 高 | 中等 |

## 🎯 推荐方案

### 开发环境
- **推荐**: 云端 API 方案
- **原因**: 快速启动，专注开发

### 生产环境
- **推荐**: 混合部署
- **原因**: 成本可控，性能稳定

### 演示环境
- **推荐**: 云端 API 方案
- **原因**: 简单易用，快速部署

## 📚 相关文档

- [云端 API 集成方案](./cloud-api-integration.md)
- [Docker 部署指南](./docker-setup.md)
- [模型管理指南](./model-management.md)
- [故障排除指南](./troubleshooting.md)

---

*通过云端 API 服务，你可以在几分钟内启动一个完整的音频编辑器项目，无需复杂的本地环境配置。*
