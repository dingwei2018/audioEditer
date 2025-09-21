const redis = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

let redisClient = null;

// Redis 客户端设置
const setupRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: config.database.redis.host,
        port: config.database.redis.port
      },
      password: config.database.redis.password,
      database: config.database.redis.db,
      retryDelayOnFailover: config.database.redis.retryDelayOnFailover,
      enableReadyCheck: config.database.redis.enableReadyCheck,
      maxRetriesPerRequest: config.database.redis.maxRetriesPerRequest
    });

    // 连接事件处理
    redisClient.on('error', (err) => {
      logger.error('Redis 连接错误:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis 连接成功');
    });

    redisClient.on('ready', () => {
      logger.info('Redis 客户端就绪');
    });

    redisClient.on('end', () => {
      logger.info('Redis 连接已断开');
    });

    // 连接到 Redis
    await redisClient.connect();

    // 测试连接
    await redisClient.ping();

    logger.info('Redis 数据库连接成功');
    return redisClient;
  } catch (error) {
    logger.error('Redis 数据库连接失败:', error);
    throw error;
  }
};

// 获取 Redis 客户端
const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis 客户端未初始化');
  }
  return redisClient;
};

// 缓存操作封装
const cache = {
  // 设置缓存
  set: async (key, value, ttl = 3600) => {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Redis SET 操作失败:', { key, error: error.message });
      return false;
    }
  },

  // 获取缓存
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis GET 操作失败:', { key, error: error.message });
      return null;
    }
  },

  // 删除缓存
  del: async (key) => {
    try {
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL 操作失败:', { key, error: error.message });
      return false;
    }
  },

  // 检查键是否存在
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS 操作失败:', { key, error: error.message });
      return false;
    }
  },

  // 设置过期时间
  expire: async (key, ttl) => {
    try {
      const result = await redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE 操作失败:', { key, ttl, error: error.message });
      return false;
    }
  },

  // 获取剩余过期时间
  ttl: async (key) => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Redis TTL 操作失败:', { key, error: error.message });
      return -1;
    }
  }
};

// 会话管理
const session = {
  // 设置会话
  set: async (sessionId, data, ttl = 86400) => {
    const key = `session:${sessionId}`;
    return await cache.set(key, data, ttl);
  },

  // 获取会话
  get: async (sessionId) => {
    const key = `session:${sessionId}`;
    return await cache.get(key);
  },

  // 删除会话
  del: async (sessionId) => {
    const key = `session:${sessionId}`;
    return await cache.del(key);
  },

  // 延长会话
  extend: async (sessionId, ttl = 86400) => {
    const key = `session:${sessionId}`;
    return await cache.expire(key, ttl);
  }
};

// 任务队列
const queue = {
  // 添加任务到队列
  push: async (queueName, task, priority = 0) => {
    try {
      const key = `queue:${queueName}`;
      const taskData = {
        id: Date.now() + Math.random(),
        data: task,
        priority,
        createdAt: new Date().toISOString()
      };
      
      await redisClient.lPush(key, JSON.stringify(taskData));
      return taskData.id;
    } catch (error) {
      logger.error('队列 PUSH 操作失败:', { queueName, error: error.message });
      return null;
    }
  },

  // 从队列获取任务
  pop: async (queueName, timeout = 0) => {
    try {
      const key = `queue:${queueName}`;
      const result = await redisClient.brPop(redisClient.commandOptions({ isolated: true }), key, timeout);
      
      if (result) {
        return JSON.parse(result.element);
      }
      return null;
    } catch (error) {
      logger.error('队列 POP 操作失败:', { queueName, error: error.message });
      return null;
    }
  },

  // 获取队列长度
  length: async (queueName) => {
    try {
      const key = `queue:${queueName}`;
      return await redisClient.lLen(key);
    } catch (error) {
      logger.error('队列 LENGTH 操作失败:', { queueName, error: error.message });
      return 0;
    }
  }
};

// 发布订阅
const pubsub = {
  // 发布消息
  publish: async (channel, message) => {
    try {
      const subscribers = await redisClient.publish(channel, JSON.stringify(message));
      return subscribers;
    } catch (error) {
      logger.error('发布消息失败:', { channel, error: error.message });
      return 0;
    }
  },

  // 订阅频道
  subscribe: async (channels, messageHandler) => {
    try {
      const subscriber = redisClient.duplicate();
      await subscriber.connect();

      for (const channel of channels) {
        await subscriber.subscribe(channel, (message) => {
          try {
            const parsedMessage = JSON.parse(message);
            messageHandler(channel, parsedMessage);
          } catch (error) {
            logger.error('消息解析失败:', { channel, message, error: error.message });
          }
        });
      }

      return subscriber;
    } catch (error) {
      logger.error('订阅失败:', { channels, error: error.message });
      return null;
    }
  }
};

// 关闭 Redis 连接
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis 数据库连接已关闭');
  }
};

module.exports = {
  setupRedis,
  getRedis,
  cache,
  session,
  queue,
  pubsub,
  closeRedis
};
