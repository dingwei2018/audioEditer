# 技术栈详细说明

## 前端技术栈

### 核心框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

### UI 组件
- **Element Plus** - 基于 Vue 3 的桌面端组件库
- **@element-plus/icons-vue** - Element Plus 图标库

### 状态管理
- **Pinia** - Vue 3 官方推荐的状态管理库
- **Vue Router 4** - Vue 3 官方路由管理器

### 网络请求
- **Axios** - HTTP 客户端库
- **Socket.io-client** - WebSocket 实时通信客户端

### 工具库
- **lodash-es** - JavaScript 工具函数库 (ES 模块版本)
- **moment** - 日期时间处理库

## 后端技术栈

### 核心框架
- **Fastify** - 高性能 Node.js Web 框架
- **Node.js** - JavaScript 运行时环境

### 数据库
- **MySQL2** - MySQL 数据库驱动
- **Redis** - 内存数据库，用于缓存和消息队列

### 音频处理
- **fluent-ffmpeg** - FFmpeg 的 Node.js 封装
- **node-wav** - WAV 音频文件处理
- **audio-buffer** - 音频缓冲区处理

### 文件处理
- **@fastify/multipart** - 文件上传处理
- **fs-extra** - 增强的文件系统操作
- **multer** - 文件上传中间件

### 实时通信
- **Socket.io** - WebSocket 服务端
- **@fastify/websocket** - Fastify WebSocket 插件

### 工具库
- **lodash** - JavaScript 工具函数库
- **moment** - 日期时间处理
- **joi** - 数据验证库
- **winston** - 日志系统
- **uuid** - UUID 生成器
- **dotenv** - 环境变量管理

### 开发工具
- **nodemon** - 自动重启开发服务器
- **eslint** - 代码质量检查
- **jest** - 测试框架

## 第三方服务集成

### TTS 服务商
- **阿里云 DashScope** - 主要 TTS 服务，支持 CosyVoice 和 Sambert 模型
- **GPT-SoVITS 云端 API** - 语音克隆和合成服务
- **腾讯云语音合成** - 备用 TTS 服务
- **百度AI语音合成** - 备用 TTS 服务

### 部署和运维
- **Docker** - 容器化部署
- **Nginx** - 反向代理服务器
- **PM2** - Node.js 进程管理器

## 开发环境要求

- Node.js >= 18.0.0
- Redis Server
- MySQL/PostgreSQL
- FFmpeg (系统依赖)

## 项目特性

1. **前后端分离架构**
2. **云端 API 集成**
3. **实时音频处理**
4. **WebSocket 双向通信**
5. **模块化组件设计**
6. **类型安全 (TypeScript)**
7. **响应式状态管理**
8. **音频流式处理**
9. **云端服务解耦**
10. **容器化部署**