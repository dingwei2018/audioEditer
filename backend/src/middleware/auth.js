const logger = require('../utils/logger');

// 简单的认证中间件（可根据需要扩展）
async function authMiddleware(request, reply) {
  // 对于健康检查等公开接口，跳过认证
  if (request.url === '/health' || request.url.startsWith('/docs')) {
    return;
  }

  // 检查 API 密钥（简单实现）
  const apiKey = request.headers['x-api-key'] || request.query.api_key;
  
  if (!apiKey) {
    // 开发环境跳过认证
    if (process.env.NODE_ENV === 'development') {
      logger.debug('开发环境跳过 API 密钥认证');
      return;
    }
    
    reply.code(401).send({ error: '缺少 API 密钥' });
    return;
  }

  // 验证 API 密钥（这里可以添加实际的验证逻辑）
  // 目前只是简单的检查
  if (apiKey !== process.env.API_KEY && apiKey !== 'dev-key') {
    reply.code(401).send({ error: '无效的 API 密钥' });
    return;
  }

  // 将用户信息添加到请求对象
  request.user = {
    apiKey: apiKey,
    // 可以添加更多用户信息
  };
}

module.exports = authMiddleware;
