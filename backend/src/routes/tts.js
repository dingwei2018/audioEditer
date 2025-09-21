const fastify = require('fastify');
const logger = require('../utils/logger');

async function ttsRoutes(fastify, options) {
  // TTS 合成
  fastify.post('/synthesize', async (request, reply) => {
    try {
      const { text, voice, speed, pitch, service } = request.body;

      if (!text || text.trim().length === 0) {
        return reply.code(400).send({ error: '文本内容不能为空' });
      }

      logger.info('TTS 合成请求', { text: text.substring(0, 50), voice, speed, pitch });

      // 获取 TTS 代理服务
      const ttsService = fastify.ttsProxyService;
      
      if (!ttsService) {
        return reply.code(503).send({ error: 'TTS 服务不可用' });
      }

      // 调用 TTS 代理服务
      const result = await ttsService.synthesize({
        text,
        voice,
        speed,
        pitch,
        service
      });

      reply.send(result);
    } catch (error) {
      logger.error('TTS 合成失败:', error);
      reply.code(500).send({ error: 'TTS 合成失败', details: error.message });
    }
  });

  // 获取可用语音列表
  fastify.get('/voices', async (request, reply) => {
    try {
      const { service } = request.query;
      
      // TODO: 从 TTS 代理服务获取语音列表
      const voices = [
        { id: 'zhichu', name: '知初', language: 'zh-CN', gender: 'female' },
        { id: 'zhiyan', name: '知燕', language: 'zh-CN', gender: 'female' },
        { id: 'zhizhe', name: '知哲', language: 'zh-CN', gender: 'male' },
        { id: 'zhibei', name: '知贝', language: 'zh-CN', gender: 'male' }
      ];

      reply.send({
        success: true,
        voices: voices
      });
    } catch (error) {
      logger.error('获取语音列表失败:', error);
      reply.code(500).send({ error: '获取语音列表失败' });
    }
  });

  // TTS 服务状态
  fastify.get('/status', async (request, reply) => {
    try {
      // TODO: 获取 TTS 服务状态
      reply.send({
        success: true,
        services: {
          aliyun: 'healthy',
          gptSovits: 'healthy'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取 TTS 服务状态失败:', error);
      reply.code(500).send({ error: '获取服务状态失败' });
    }
  });
}

module.exports = ttsRoutes;
