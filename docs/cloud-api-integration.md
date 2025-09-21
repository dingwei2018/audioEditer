# ☁️ 云端 API 集成方案

## 概述

当本地 Docker 部署遇到困难时，可以使用云端 API 服务来替代本地部署的 CosyVoice 和 GPT-SoVITS 服务。这样可以避免复杂的本地环境配置，快速启动项目。

## 🌟 可用的云端服务

### 1. CosyVoice 云端服务

#### 阿里云 CosyVoice 服务
- **服务商**: 阿里云
- **特点**: 基于 CosyVoice 的语音合成大模型服务
- **优势**: 
  - 高质量语音合成
  - 支持多种语言
  - 稳定可靠的服务
- **API 文档**: [阿里云 CosyVoice 服务](https://m.aliyun.com/sswd/13932411-1.html)

#### ModelScope 平台
- **服务商**: 魔搭社区 (ModelScope)
- **特点**: 开源模型托管平台
- **优势**:
  - 免费使用额度
  - 支持 CosyVoice 模型
  - 社区支持
- **访问地址**: https://modelscope.cn

### 2. GPT-SoVITS 云端服务

#### 阿里云函数计算部署
- **服务商**: 阿里云
- **特点**: 基于函数计算的 GPT-SoVITS 部署
- **优势**:
  - 按需付费
  - 自动扩缩容
  - 语音克隆功能
- **部署指南**: [阿里云 GPT-SoVITS 部署](https://help.aliyun.com/zh/functioncompute/fc-3-0/use-cases/function-compute-based-deployment-of-gpt-sovits-speech-generation-model-for-ai-sound-cloning)

#### 社区 API 服务
- **服务商**: 开源社区
- **特点**: 开发者提供的 API 接口
- **优势**:
  - 免费使用
  - 活跃的社区支持
  - 易于集成
- **GitHub**: [GPT-SoVITS API](https://github.com/jianchang512/gptsovits-api)

## 🔧 集成方案

### 方案 1: 混合部署 (推荐)

```yaml
# docker-compose-cloud.yml
services:
  # 本地服务
  backend:
    build: ./backend
    # ... 其他配置
  
  frontend:
    build: ./frontend
    # ... 其他配置
  
  mysql:
    image: mysql:8.0
    # ... 其他配置
  
  redis:
    image: redis:7-alpine
    # ... 其他配置
  
  nginx:
    image: nginx:alpine
    # ... 其他配置
  
  # 云端 API 代理服务
  tts-proxy:
    build: ./docker/tts-proxy
    environment:
      - COSYVOICE_API_URL=${COSYVOICE_API_URL}
      - COSYVOICE_API_KEY=${COSYVOICE_API_KEY}
      - GPT_SOVITS_API_URL=${GPT_SOVITS_API_URL}
      - GPT_SOVITS_API_KEY=${GPT_SOVITS_API_KEY}
    ports:
      - "8001:8001"  # CosyVoice 代理
      - "8051:8051"  # GPT-SoVITS 代理
```

### 方案 2: 完全云端

```yaml
# docker-compose-cloud-only.yml
services:
  # 只部署本地服务
  backend:
    build: ./backend
    environment:
      - COSYVOICE_URL=${COSYVOICE_CLOUD_API_URL}
      - GPT_SOVITS_URL=${GPT_SOVITS_CLOUD_API_URL}
    # ... 其他配置
  
  frontend:
    build: ./frontend
    # ... 其他配置
  
  mysql:
    image: mysql:8.0
    # ... 其他配置
  
  redis:
    image: redis:7-alpine
    # ... 其他配置
  
  nginx:
    image: nginx:alpine
    # ... 其他配置
```

## 📝 配置示例

### 环境变量配置

```bash
# .env.cloud
# CosyVoice 云端 API 配置
COSYVOICE_CLOUD_API_URL=https://api.aliyun.com/cosyvoice/v1
COSYVOICE_API_KEY=your_cosyvoice_api_key
COSYVOICE_MODEL_ID=cosyvoice-zh

# GPT-SoVITS 云端 API 配置
GPT_SOVITS_CLOUD_API_URL=https://api.example.com/gpt-sovits/v1
GPT_SOVITS_API_KEY=your_gpt_sovits_api_key
GPT_SOVITS_MODEL_ID=gpt-sovits-zh

# 本地服务配置
MYSQL_ROOT_PASSWORD=audioediter_root
MYSQL_DATABASE=audioediter
REDIS_URL=redis://redis:6379
```

### 后端 API 适配

```javascript
// backend/src/services/tts-service.js
class CloudTTSService {
  constructor() {
    this.cosyvoiceUrl = process.env.COSYVOICE_CLOUD_API_URL;
    this.cosyvoiceKey = process.env.COSYVOICE_API_KEY;
    this.gptSovitsUrl = process.env.GPT_SOVITS_CLOUD_API_URL;
    this.gptSovitsKey = process.env.GPT_SOVITS_API_KEY;
  }

  async synthesizeWithCosyVoice(text, options = {}) {
    const response = await fetch(`${this.cosyvoiceUrl}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.cosyvoiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: options.voice || 'default',
        speed: options.speed || 1.0,
        pitch: options.pitch || 1.0
      })
    });
    
    return await response.json();
  }

  async synthesizeWithGPTSoVITS(text, referenceAudio, options = {}) {
    const response = await fetch(`${this.gptSovitsUrl}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.gptSovitsKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        reference_audio: referenceAudio,
        voice_clone: options.voiceClone || false
      })
    });
    
    return await response.json();
  }
}
```

## 🚀 快速启动

### 1. 云端 API 方案启动

```bash
# 使用云端 API 配置启动
cp .env.cloud .env
docker-compose -f docker-compose-cloud-only.yml up -d

# 检查服务状态
./scripts/docker-status.sh
```

### 2. 混合部署方案启动

```bash
# 使用混合部署配置
docker-compose -f docker-compose-cloud.yml up -d

# 检查服务状态
./scripts/docker-status.sh
```

## 💰 成本对比

| 方案 | 成本 | 优势 | 劣势 |
|------|------|------|------|
| 本地部署 | 免费 | 完全控制、无网络依赖 | 配置复杂、资源消耗大 |
| 云端 API | 按使用付费 | 简单易用、稳定可靠 | 依赖网络、有使用限制 |
| 混合部署 | 中等 | 灵活性高、成本可控 | 配置稍复杂 |

## 🔍 服务商对比

### CosyVoice 服务商

| 服务商 | 价格 | 质量 | 稳定性 | 推荐度 |
|--------|------|------|--------|--------|
| 阿里云 | 中等 | 高 | 高 | ⭐⭐⭐⭐⭐ |
| ModelScope | 免费 | 高 | 中等 | ⭐⭐⭐⭐ |
| 自建服务 | 免费 | 高 | 依赖运维 | ⭐⭐⭐ |

### GPT-SoVITS 服务商

| 服务商 | 价格 | 质量 | 稳定性 | 推荐度 |
|--------|------|------|--------|--------|
| 阿里云 | 中等 | 高 | 高 | ⭐⭐⭐⭐⭐ |
| 社区服务 | 免费 | 中等 | 中等 | ⭐⭐⭐ |
| 自建服务 | 免费 | 高 | 依赖运维 | ⭐⭐⭐ |

## 📋 实施步骤

### 步骤 1: 选择服务商
1. 注册阿里云账号或 ModelScope 账号
2. 申请 API 密钥
3. 测试 API 可用性

### 步骤 2: 配置环境
1. 创建 `.env.cloud` 配置文件
2. 设置 API 密钥和端点
3. 测试连接

### 步骤 3: 修改代码
1. 更新后端服务适配云端 API
2. 修改前端调用逻辑
3. 测试功能完整性

### 步骤 4: 部署验证
1. 启动云端配置的服务
2. 运行功能测试
3. 性能监控

## 🛠️ 故障排除

### 常见问题

1. **API 调用失败**
   ```bash
   # 检查 API 密钥
   curl -H "Authorization: Bearer $API_KEY" $API_URL/health
   
   # 检查网络连接
   ping api.aliyun.com
   ```

2. **响应超时**
   ```bash
   # 增加超时时间
   export TTS_API_TIMEOUT=30000
   ```

3. **配额超限**
   ```bash
   # 检查使用量
   curl -H "Authorization: Bearer $API_KEY" $API_URL/usage
   ```

## 📚 相关资源

- [阿里云语音合成服务](https://www.aliyun.com/product/nls)
- [ModelScope 平台](https://modelscope.cn)
- [GPT-SoVITS GitHub](https://github.com/RVC-Boss/GPT-SoVITS)
- [CosyVoice GitHub](https://github.com/FunAudioLLM/CosyVoice)

---

*通过云端 API 服务，可以快速启动项目，避免复杂的本地环境配置问题。*
