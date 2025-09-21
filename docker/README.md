# 音频编辑器 Docker 部署

本项目支持使用 Docker 方式运行完整的音频编辑器服务，包括前端、后端、数据库和 TTS 服务。

## 🚀 快速开始

### 1. 启动服务
```bash
# 使用启动脚本（推荐）
./scripts/docker-start.sh

# 或使用 Docker Compose
docker-compose up -d
```

### 2. 检查状态
```bash
./scripts/docker-status.sh
```

### 3. 测试服务
```bash
./scripts/docker-test.sh
```

### 4. 停止服务
```bash
./scripts/docker-stop.sh
```

## 📁 目录结构

```
docker/
├── backend/
│   └── Dockerfile          # Node.js 后端服务镜像
├── frontend/
│   └── Dockerfile          # Vue 3 前端服务镜像
├── cosyvoice/
│   ├── Dockerfile          # CosyVoice 服务镜像
│   └── .dockerignore       # Docker 构建忽略文件
├── gpt-sovits/
│   ├── Dockerfile          # GPT-SoVITS 服务镜像
│   └── .dockerignore       # Docker 构建忽略文件
├── nginx/
│   ├── nginx.conf          # Nginx 主配置
│   └── default.conf        # 反向代理配置
├── mysql/
│   └── init/
│       └── 01-init.sql     # 数据库初始化脚本
└── README.md              # 本文档
```

## 🔧 配置说明

### 服务端口
- **前端应用**: 5173
- **后端 API**: 3000
- **CosyVoice**: 8001
- **GPT-SoVITS**: 8051
- **MySQL**: 3306
- **Redis**: 6379
- **Nginx 代理**: 80

### 访问地址
- 前端应用: http://localhost:5173
- 统一入口: http://localhost:80
- 后端 API: http://localhost:80/api
- CosyVoice: http://localhost:80/cosyvoice
- GPT-SoVITS: http://localhost:80/gpt-sovits
- 健康检查: http://localhost:80/health

## 🛠️ 管理脚本

### 启动脚本 (`docker-start.sh`)
```bash
./scripts/docker-start.sh [选项]

选项:
  --help         显示帮助信息
  --cpu          强制使用 CPU 模式
  --build-only   仅构建镜像，不启动服务
  --no-build     跳过构建，直接启动服务
```

### 状态脚本 (`docker-status.sh`)
```bash
./scripts/docker-status.sh [选项]

选项:
  --help         显示帮助信息
  --docker-only  仅显示 Docker 容器状态
  --services-only 仅显示服务状态
  --verbose      显示详细状态信息
```

### 测试脚本 (`docker-test.sh`)
```bash
./scripts/docker-test.sh

# 测试所有服务的健康状态和 API 接口
```

### 停止脚本 (`docker-stop.sh`)
```bash
./scripts/docker-stop.sh [选项]

选项:
  --help          显示帮助信息
  --cleanup       停止服务并清理卷和孤儿容器
  --remove-images 停止服务并删除所有相关镜像
```

## 📋 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f cosyvoice-tts
docker-compose logs -f gpt-sovits-tts

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart cosyvoice-tts

# 进入容器
docker-compose exec cosyvoice-tts bash
docker-compose exec gpt-sovits-tts bash

# 查看资源使用
docker stats
```

## 🔍 故障排除

### 1. 服务启动失败
```bash
# 检查日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep :8050
netstat -tlnp | grep :8051
```

### 2. GPU 不可用
```bash
# 检查 NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# 使用 CPU 模式
./scripts/docker-start.sh --cpu
```

### 3. 内存不足
```bash
# 检查系统内存
free -h

# 检查 Docker 内存使用
docker stats
```

## 📚 详细文档

更多详细信息请参考：
- [Docker 部署指南](../docs/docker-setup.md)
- [CosyVoice 官方文档](https://github.com/FunAudioLLM/CosyVoice)
- [GPT-SoVITS 官方文档](https://github.com/RVC-Boss/GPT-SoVITS)

---

**注意**: 确保已安装 Docker 和 Docker Compose，并且有足够的系统资源运行服务。

