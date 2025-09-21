# 音频编辑器 Docker 部署指南

本文档介绍如何使用 Docker 方式运行 CosyVoice 和 GPT-SoVITS TTS 服务。

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [服务管理](#服务管理)
- [故障排除](#故障排除)
- [高级配置](#高级配置)

## 🔧 系统要求

### 硬件要求
- **CPU**: 4 核心以上
- **内存**: 8GB 以上（推荐 16GB）
- **存储**: 20GB 以上可用空间
- **GPU**: NVIDIA GPU（可选，用于加速）

### 软件要求
- **操作系统**: Linux, macOS, Windows
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **NVIDIA Docker**: 2.0+（如果使用 GPU）

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd audioediter
```

### 2. 启动服务
```bash
# 使用启动脚本（推荐）
./scripts/docker-start.sh

# 或使用 Docker Compose
docker-compose up -d
```

### 3. 检查状态
```bash
# 查看服务状态
./scripts/docker-status.sh

# 或直接访问
curl http://localhost:8080/health
```

### 4. 访问服务
- **统一入口**: http://localhost:8080
- **CosyVoice**: http://localhost:8080/cosyvoice
- **GPT-SoVITS**: http://localhost:8080/gpt-sovits
- **API 文档**: http://localhost:8080/cosyvoice/docs

## 📁 项目结构

```
audioediter/
├── docker/
│   ├── cosyvoice/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── gpt-sovits/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   └── nginx/
│       ├── nginx.conf
│       └── default.conf
├── scripts/
│   ├── docker-start.sh
│   ├── docker-stop.sh
│   └── docker-status.sh
├── docker-compose.yml
└── docs/
    └── docker-setup.md
```

## 🔧 详细配置

### 环境变量

#### CosyVoice 服务
```bash
# CUDA 设备
CUDA_VISIBLE_DEVICES=0

# Python 路径
PYTHONPATH=/workspace/CosyVoice:/workspace/CosyVoice/third_party/Matcha-TTS

# PyTorch 内存配置
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

#### GPT-SoVITS 服务
```bash
# CUDA 设备
CUDA_VISIBLE_DEVICES=0

# Python 路径
PYTHONPATH=/workspace/GPT-SoVITS

# PyTorch 内存配置
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### 端口配置

| 服务 | 端口 | 描述 |
|------|------|------|
| CosyVoice | 8050 | CosyVoice API 服务 |
| GPT-SoVITS | 8051 | GPT-SoVITS API 服务 |
| GPT-SoVITS | 9880 | GPT-SoVITS 原始服务 |
| Nginx | 8080 | 统一反向代理 |

### 卷挂载

```yaml
volumes:
  # 模型文件（只读）
  - ./cosyvoice2-service/models:/workspace/models:ro
  - ./gpt-sovits-service/models:/workspace/models:ro
  
  # 临时文件
  - ./cosyvoice2-service/temp:/workspace/temp
  - ./gpt-sovits-service/temp:/workspace/temp
  
  # 日志文件
  - ./cosyvoice2-service/logs:/workspace/logs
  - ./gpt-sovits-service/logs:/workspace/logs
```

## 🛠️ 服务管理

### 启动服务
```bash
# 完整启动（推荐）
./scripts/docker-start.sh

# 仅构建镜像
./scripts/docker-start.sh --build-only

# 跳过构建，直接启动
./scripts/docker-start.sh --no-build

# 强制 CPU 模式
./scripts/docker-start.sh --cpu
```

### 停止服务
```bash
# 停止服务
./scripts/docker-stop.sh

# 停止并清理
./scripts/docker-stop.sh --cleanup

# 停止并删除镜像
./scripts/docker-stop.sh --remove-images
```

### 查看状态
```bash
# 完整状态
./scripts/docker-status.sh

# 仅容器状态
./scripts/docker-status.sh --docker-only

# 仅服务状态
./scripts/docker-status.sh --services-only

# 详细状态
./scripts/docker-status.sh --verbose
```

### 常用 Docker Compose 命令
```bash
# 查看日志
docker-compose logs -f
docker-compose logs -f cosyvoice-tts
docker-compose logs -f gpt-sovits-tts

# 重启服务
docker-compose restart
docker-compose restart cosyvoice-tts

# 进入容器
docker-compose exec cosyvoice-tts bash
docker-compose exec gpt-sovits-tts bash

# 查看资源使用
docker-compose top
docker stats
```

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查日志
docker-compose logs cosyvoice-tts
docker-compose logs gpt-sovits-tts

# 检查端口占用
netstat -tlnp | grep :8050
netstat -tlnp | grep :8051

# 重启服务
docker-compose restart
```

#### 2. GPU 不可用
```bash
# 检查 NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# 使用 CPU 模式
./scripts/docker-start.sh --cpu
```

#### 3. 模型文件缺失
```bash
# 检查模型目录
ls -la cosyvoice2-service/models/
ls -la gpt-sovits-service/models/

# 下载模型文件（参考模型下载指南）
```

#### 4. 内存不足
```bash
# 检查系统内存
free -h

# 检查 Docker 内存限制
docker stats

# 调整 PyTorch 内存配置
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:256
```

### 日志分析

#### CosyVoice 日志
```bash
# 查看启动日志
docker-compose logs cosyvoice-tts | grep -i "error\|warning\|success"

# 实时日志
docker-compose logs -f cosyvoice-tts
```

#### GPT-SoVITS 日志
```bash
# 查看启动日志
docker-compose logs gpt-sovits-tts | grep -i "error\|warning\|success"

# 实时日志
docker-compose logs -f gpt-sovits-tts
```

## ⚙️ 高级配置

### 自定义配置

#### 修改端口
编辑 `docker-compose.yml`:
```yaml
services:
  cosyvoice-tts:
    ports:
      - "9050:8050"  # 修改为 9050
```

#### 添加环境变量
```yaml
services:
  cosyvoice-tts:
    environment:
      - CUSTOM_SETTING=value
      - DEBUG=true
```

#### 调整资源限制
```yaml
services:
  cosyvoice-tts:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
        reservations:
          memory: 4G
          cpus: '2.0'
```

### 生产环境配置

#### 使用 Docker Swarm
```bash
# 初始化 Swarm
docker swarm init

# 部署服务栈
docker stack deploy -c docker-compose.yml audio-editor
```

#### 使用外部数据库
```yaml
services:
  redis:
    image: redis:alpine
    networks:
      - tts-network
```

#### 配置 SSL/TLS
```yaml
services:
  nginx:
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - SSL_CERT=/etc/nginx/ssl/cert.pem
      - SSL_KEY=/etc/nginx/ssl/key.pem
```

## 📚 相关文档

- [CosyVoice 官方文档](https://github.com/FunAudioLLM/CosyVoice)
- [GPT-SoVITS 官方文档](https://github.com/RVC-Boss/GPT-SoVITS)
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 检查项目 Issues
3. 查看服务日志
4. 提交新的 Issue 并提供详细信息

---

**注意**: 本配置基于 macOS 环境优化，在其他平台上可能需要调整。

