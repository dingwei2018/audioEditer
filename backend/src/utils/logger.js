const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// 创建 Winston logger
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: {
    service: 'audio-editor-backend'
  },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 综合日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// 开发环境添加控制台输出
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 生产环境添加控制台输出（仅错误级别）
if (config.server.env === 'production') {
  logger.add(new winston.transports.Console({
    level: 'error',
    format: consoleFormat
  }));
}

// 扩展 logger 方法
logger.audit = (action, details) => {
  logger.info('AUDIT', {
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.performance = (operation, duration, details) => {
  logger.info('PERFORMANCE', {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.security = (event, details) => {
  logger.warn('SECURITY', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.business = (event, data) => {
  logger.info('BUSINESS', {
    event,
    data,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
