const logger = require('../utils/logger');

async function errorHandler(error, request, reply) {
  // 记录错误
  logger.error('请求处理错误:', {
    url: request.url,
    method: request.method,
    error: error.message,
    stack: error.stack
  });

  // 根据错误类型返回不同的响应
  if (error.validation) {
    // 验证错误
    reply.code(400).send({
      error: '请求参数验证失败',
      details: error.validation
    });
    return;
  }

  if (error.statusCode) {
    // HTTP 错误
    reply.code(error.statusCode).send({
      error: error.message || '请求处理失败'
    });
    return;
  }

  // 默认错误响应 - 避免循环引用
  const errorResponse = {
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message
  };
  
  reply.code(500).send(errorResponse);
}

module.exports = errorHandler;
