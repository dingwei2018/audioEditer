const path = require('path');

// 服务器配置
const server = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development'
};

// 数据库配置
const database = {
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'audioediter',
    password: process.env.MYSQL_PASSWORD || 'audioediter_pass',
    database: process.env.MYSQL_DATABASE || 'audioediter',
    charset: 'utf8mb4',
    timezone: '+08:00',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  }
};

// TTS 服务配置
const tts = {
  // 阿里云 DashScope 配置
  aliyun: {
    // RESTful API 端点（用于测试和兼容）
    apiUrl: process.env.COSYVOICE_CLOUD_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/speech-synthesizer',
    // WebSocket API 端点（推荐使用）
    wsUrl: process.env.COSYVOICE_WS_URL || 'wss://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/speech-synthesizer',
    apiKey: process.env.COSYVOICE_API_KEY || '',
    modelId: process.env.COSYVOICE_MODEL_ID || 'sambert-zhichu-v1', // 使用可用的模型版本
    voiceId: process.env.COSYVOICE_VOICE_ID || 'zhichu',
    timeout: parseInt(process.env.TTS_API_TIMEOUT) || 30000,
    retryCount: parseInt(process.env.TTS_API_RETRY_COUNT) || 3,
    // 支持的模型列表
    supportedModels: ['cosyvoice-v3-plus', 'cosyvoice-v3', 'cosyvoice-v2', 'cosyvoice-v1'],
    // 默认使用 WebSocket
    useWebSocket: process.env.COSYVOICE_USE_WS !== 'false'
  },
  
  // GPT-SoVITS 云端 API 配置
  gptSovits: {
    apiUrl: process.env.GPT_SOVITS_CLOUD_API_URL || '',
    apiKey: process.env.GPT_SOVITS_API_KEY || '',
    modelId: process.env.GPT_SOVITS_MODEL_ID || 'gpt-sovits-zh',
    timeout: parseInt(process.env.TTS_API_TIMEOUT) || 60000,
    retryCount: parseInt(process.env.TTS_API_RETRY_COUNT) || 3
  },
  
  // 通用配置
  default: {
    timeout: parseInt(process.env.TTS_API_TIMEOUT) || 30000,
    retryCount: parseInt(process.env.TTS_API_RETRY_COUNT) || 3,
    retryDelay: parseInt(process.env.TTS_API_RETRY_DELAY) || 1000,
    maxConcurrent: parseInt(process.env.TTS_MAX_CONCURRENT) || 5
  }
};

// CORS 配置
const cors = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// 日志配置
const log = {
  level: process.env.LOG_LEVEL || (server.env === 'production' ? 'info' : 'debug'),
  format: process.env.LOG_FORMAT || 'json',
  prettyPrint: server.env !== 'production'
};

// 文件上传配置
const upload = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/webm',
    'text/plain'
  ],
  tempDir: process.env.UPLOAD_TEMP_DIR || path.join(process.cwd(), 'temp'),
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
};

// 音频处理配置
const audio = {
  ffmpeg: {
    path: process.env.FFMPEG_PATH || 'ffmpeg',
    timeout: 30000
  },
  supportedFormats: ['wav', 'mp3', 'ogg', 'webm'],
  outputFormat: 'wav',
  sampleRate: 22050,
  channels: 1,
  bitRate: '128k'
};

// 安全配置
const security = {
  rateLimit: {
    max: parseInt(process.env.API_RATE_LIMIT) || 100,
    timeWindow: parseInt(process.env.API_RATE_WINDOW) || 60000 // 1 minute
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

// 导出配置
module.exports = {
  server,
  database,
  tts,
  cors,
  log,
  upload,
  audio,
  security
};
