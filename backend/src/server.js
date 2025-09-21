#!/usr/bin/env node

const Fastify = require('fastify');
const path = require('path');
const { Server } = require('socket.io');

// 加载环境变量
require('dotenv').config();

// 导入配置和插件
const config = require('./config/config');
const logger = require('./utils/logger');
const { setupDatabase, getDatabase } = require('./config/database');
const { setupRedis } = require('./config/redis');

// 导入路由
const audioRoutes = require('./routes/audio');
const ttsRoutes = require('./routes/tts');
const projectRoutes = require('./routes/project');

// 导入中间件
const corsMiddleware = require('./middleware/cors');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// 导入服务
const TTSProxyService = require('./services/ttsProxyService');

class AudioEditorServer {
  constructor() {
    this.fastify = null;
    this.io = null;
    this.ttsProxyService = null;
  }

  async initialize() {
    try {
      // 创建 Fastify 实例
      this.fastify = Fastify({
        logger: true,
        bodyLimit: 1048576 * 100, // 100MB
        maxParamLength: 500
      });

      // 注册中间件
      await this.registerMiddleware();
      
      // 初始化数据库和 Redis
      await this.initializeDatabase();
      
      // 初始化 TTS 代理服务
      await this.initializeTTSServices();
      
      // 注册路由
      await this.registerRoutes();
      
      // 初始化 WebSocket
      await this.initializeWebSocket();
      
      // 注册错误处理器
      this.registerErrorHandler();

      logger.info('服务器初始化完成');
    } catch (error) {
      logger.error('服务器初始化失败:', error);
      throw error;
    }
  }

  async registerMiddleware() {
    // 注册 Fastify 插件
    await this.fastify.register(require('@fastify/cors'), corsMiddleware);
    await this.fastify.register(require('@fastify/multipart'), {
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
      }
    });
    await this.fastify.register(require('@fastify/websocket'));
    
    // 注册自定义中间件
    this.fastify.addHook('preHandler', authMiddleware);
  }

  async initializeDatabase() {
    try {
      await setupDatabase();
      await setupRedis();
      logger.info('数据库连接成功');
    } catch (error) {
      logger.error('数据库连接失败:', error);
      // 开发环境下允许数据库连接失败继续启动
      if (config.server.env === 'development') {
        logger.warn('开发环境：数据库连接失败，但服务将继续启动');
      } else {
        throw error;
      }
    }
  }

  async initializeTTSServices() {
    try {
      this.ttsProxyService = new TTSProxyService(config.tts);
      await this.ttsProxyService.initialize();
      
      // 将 TTS 服务附加到 Fastify 实例，供路由使用
      this.fastify.decorate('ttsProxyService', this.ttsProxyService);
      
      logger.info('TTS 代理服务初始化成功');
    } catch (error) {
      logger.error('TTS 代理服务初始化失败:', error);
      // 开发环境下允许 TTS 服务初始化失败继续启动
      if (config.server.env === 'development') {
        logger.warn('开发环境：TTS 服务初始化失败，但服务将继续启动');
        this.ttsProxyService = null;
        this.fastify.decorate('ttsProxyService', null);
      } else {
        throw error;
      }
    }
  }

  async registerRoutes() {
    // 健康检查路由
    this.fastify.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
        services: {
          server: 'running',
          database: getDatabase() ? 'connected' : 'disconnected',
          redis: 'unknown', // Redis 状态检查需要单独实现
          tts: this.ttsProxyService ? 'connected' : 'disconnected'
        }
      };
    });

    // 注册业务路由
    await this.fastify.register(audioRoutes, { prefix: '/api/audio' });
    await this.fastify.register(ttsRoutes, { prefix: '/api/tts' });
    await this.fastify.register(projectRoutes, { prefix: '/api/project' });

    logger.info('路由注册完成');
  }

  async initializeWebSocket() {
    // 创建 Socket.IO 服务器
    this.io = new Server(this.fastify.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST']
      },
      path: '/socket.io'
    });

    // Socket.IO 连接处理
    this.io.on('connection', (socket) => {
      logger.info(`客户端连接: ${socket.id}`);

      // 处理 TTS 合成请求
      socket.on('tts-synthesize', async (data) => {
        try {
          const result = await this.ttsProxyService.synthesize(data);
          socket.emit('tts-result', result);
        } catch (error) {
          socket.emit('tts-error', { error: error.message });
        }
      });

      // 处理音频处理请求
      socket.on('audio-process', async (data) => {
        try {
          // TODO: 实现音频处理逻辑
          socket.emit('audio-processed', data);
        } catch (error) {
          socket.emit('audio-error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`客户端断开连接: ${socket.id}`);
      });
    });

    logger.info('WebSocket 服务初始化完成');
  }

  registerErrorHandler() {
    this.fastify.setErrorHandler(errorHandler);
  }

  async start() {
    try {
      const address = await this.fastify.listen({
        port: config.server.port,
        host: config.server.host
      });
      
      logger.info(`服务器启动成功: ${address}`);
      logger.info(`API 文档: http://${config.server.host}:${config.server.port}/docs`);
    } catch (error) {
      logger.error('服务器启动失败:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.io) {
        this.io.close();
      }
      
      if (this.fastify) {
        await this.fastify.close();
      }
      
      logger.info('服务器已停止');
    } catch (error) {
      logger.error('服务器停止失败:', error);
    }
  }
}

// 创建服务器实例
const server = new AudioEditorServer();

// 启动服务器
async function startServer() {
  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  await server.stop();
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = server;
