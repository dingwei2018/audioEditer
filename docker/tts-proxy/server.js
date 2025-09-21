#!/usr/bin/env node

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const FormData = require('form-data');
const winston = require('winston');
require('dotenv').config();

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 8001;

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 100 次请求
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// 文件上传配置
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 云端 API 配置
const COSYVOICE_CONFIG = {
  url: process.env.COSYVOICE_API_URL,
  key: process.env.COSYVOICE_API_KEY,
  model: process.env.COSYVOICE_MODEL_ID || 'sambert-zhichu-v1'
};

const GPT_SOVITS_CONFIG = {
  url: process.env.GPT_SOVITS_API_URL,
  key: process.env.GPT_SOVITS_API_KEY,
  model: process.env.GPT_SOVITS_MODEL_ID || 'gpt-sovits-zh'
};

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      cosyvoice: !!COSYVOICE_CONFIG.url,
      gpt_sovits: !!GPT_SOVITS_CONFIG.url
    }
  });
});

// CosyVoice API 代理
app.post('/cosyvoice/synthesize', async (req, res) => {
  try {
    const { text, voice, speed = 1.0, pitch = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: '文本内容不能为空' });
    }

    if (!COSYVOICE_CONFIG.url || !COSYVOICE_CONFIG.key) {
      return res.status(500).json({ error: 'CosyVoice 服务配置未完成' });
    }

    // 调用阿里云 CosyVoice API
    const response = await axios.post(
      `${COSYVOICE_CONFIG.url}/synthesize`,
      {
        model: COSYVOICE_CONFIG.model,
        input: {
          text: text
        },
        parameters: {
          voice: voice || 'zhichu',
          speed: speed,
          pitch: pitch
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${COSYVOICE_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    logger.info('CosyVoice API 调用成功', { text: text.substring(0, 50) });
    res.json(response.data);

  } catch (error) {
    logger.error('CosyVoice API 调用失败', { error: error.message });
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'CosyVoice 服务调用失败',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'CosyVoice 服务不可用',
        details: error.message
      });
    }
  }
});

// GPT-SoVITS API 代理
app.post('/gpt-sovits/synthesize', upload.single('audio'), async (req, res) => {
  try {
    const { text, voice_clone = false } = req.body;
    const audioFile = req.file;

    if (!text) {
      return res.status(400).json({ error: '文本内容不能为空' });
    }

    if (!GPT_SOVITS_CONFIG.url || !GPT_SOVITS_CONFIG.key) {
      return res.status(500).json({ error: 'GPT-SoVITS 服务配置未完成' });
    }

    // 构建请求数据
    const formData = new FormData();
    formData.append('text', text);
    formData.append('voice_clone', voice_clone.toString());
    
    if (audioFile) {
      formData.append('audio', audioFile.buffer, {
        filename: audioFile.originalname,
        contentType: audioFile.mimetype
      });
    }

    // 调用 GPT-SoVITS API
    const response = await axios.post(
      `${GPT_SOVITS_CONFIG.url}/synthesize`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${GPT_SOVITS_CONFIG.key}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // GPT-SoVITS 可能需要更长时间
      }
    );

    logger.info('GPT-SoVITS API 调用成功', { text: text.substring(0, 50) });
    res.json(response.data);

  } catch (error) {
    logger.error('GPT-SoVITS API 调用失败', { error: error.message });
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'GPT-SoVITS 服务调用失败',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'GPT-SoVITS 服务不可用',
        details: error.message
      });
    }
  }
});

// 获取支持的语音列表
app.get('/cosyvoice/voices', async (req, res) => {
  try {
    // 返回预设的语音列表
    const voices = [
      { id: 'zhichu', name: '知初', language: 'zh-CN', gender: 'female' },
      { id: 'zhiyan', name: '知燕', language: 'zh-CN', gender: 'female' },
      { id: 'zhizhe', name: '知哲', language: 'zh-CN', gender: 'male' },
      { id: 'zhibei', name: '知贝', language: 'zh-CN', gender: 'male' }
    ];
    
    res.json({ voices });
  } catch (error) {
    logger.error('获取语音列表失败', { error: error.message });
    res.status(500).json({ error: '获取语音列表失败' });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  logger.error('服务器错误', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`TTS API 代理服务启动成功`, { port: PORT });
  logger.info('服务配置', {
    cosyvoice: !!COSYVOICE_CONFIG.url,
    gpt_sovits: !!GPT_SOVITS_CONFIG.url
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
