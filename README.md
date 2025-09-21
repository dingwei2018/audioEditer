# 音频编辑器项目

## 项目简介
云听文转声精修功能 - 专业的音频编辑和TTS优化平台

## 技术栈
- **前端**: Vue 3 + TypeScript + Element Plus + Vite
- **后端**: Node.js + Fastify + Redis + MySQL
- **本地AI**: CosyVoice 2 (阿里开源语音大模型)
- **音频处理**: FFmpeg + fluent-ffmpeg
- **实时通信**: Socket.io WebSocket
- **云端备用**: 阿里云/腾讯云/百度AI TTS API

## 架构特色
🏠 **混合架构**: 局域网服务器 + 云端备用双模式
🤖 **本地AI**: 集成CosyVoice 2大模型，150ms低延迟
🔄 **智能切换**: 自动服务发现和降级备用
⚡ **高性能**: GPU加速，并发处理，实时流式输出

## 项目结构
```
audioediter/
├── frontend/           # Vue 3 前端应用
├── backend/            # Node.js 后端服务
├── shared/             # 前后端共享代码
├── docs/               # 项目文档
├── docker/             # Docker 配置
└── scripts/            # 部署脚本
```

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- Redis Server
- MySQL/PostgreSQL
- FFmpeg

### 开发命令

#### 后端服务
```bash
cd backend
npm install
npm run dev
```

#### 前端应用
```bash
cd frontend
npm install
npm run dev
```

## 核心功能
- 🎵 音频上传和处理
- 🎯 TTS 文本转语音合成
- ✏️ 智能文本分句编辑
- 🔧 精修工具栏 (音量、语速、停顿等)
- 👁️ 实时预览和试听
- 📦 批量合成和导出
- 🔄 WebSocket 实时状态同步

## 开发文档
- [技术栈详细说明](./docs/tech-stack.md)
- [开发计划和里程碑](./docs/development-plan.md)
- [项目架构设计](./CLAUDE.md)

## 开发规范
项目采用标准的前后端分离架构，遵循以下开发规范：
- ESLint 代码检查
- TypeScript 类型安全
- Git Flow 分支策略
- 组件化模块设计

## 许可证
MIT License