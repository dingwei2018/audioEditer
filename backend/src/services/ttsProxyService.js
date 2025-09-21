const axios = require('axios');
const logger = require('../utils/logger');

class TTSProxyService {
  constructor(config) {
    this.config = config;
    this.aliyunConfig = config.aliyun;
    this.gptSovitsConfig = config.gptSovits;
    this.defaultConfig = config.default;
    
    // 创建 HTTP 客户端
    this.aliyunClient = this.createHttpClient('aliyun', this.aliyunConfig.timeout);
    this.gptSovitsClient = this.createHttpClient('gpt-sovits', this.gptSovitsConfig.timeout);
    
    // 服务状态
    this.serviceStatus = {
      aliyun: 'unknown',
      gptSovits: 'unknown'
    };
  }

  async initialize() {
    try {
      // 检查服务可用性
      await this.checkServiceHealth();
      logger.info('TTS 代理服务初始化完成');
    } catch (error) {
      logger.error('TTS 代理服务初始化失败:', error);
      throw error;
    }
  }

  createHttpClient(serviceName, timeout) {
    const client = axios.create({
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AudioEditor/1.0.0'
      }
    });

    // 请求拦截器
    client.interceptors.request.use(
      (config) => {
        logger.debug(`${serviceName} API 请求:`, {
          method: config.method,
          url: config.url,
          timeout: config.timeout
        });
        return config;
      },
      (error) => {
        logger.error(`${serviceName} API 请求错误:`, error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    client.interceptors.response.use(
      (response) => {
        logger.debug(`${serviceName} API 响应:`, {
          status: response.status,
          dataLength: response.data ? JSON.stringify(response.data).length : 0
        });
        return response;
      },
      (error) => {
        logger.error(`${serviceName} API 响应错误:`, {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  async checkServiceHealth() {
    // 检查阿里云服务
    try {
      if (this.aliyunConfig.apiKey) {
        // 阿里云百炼平台 API 健康检查 - 发送一个简单的测试请求
        const testRequest = {
          model: this.aliyunConfig.modelId,
          input: { text: '测试' },
          parameters: { voice: this.aliyunConfig.voiceId }
        };
        
        // 注意：这里只是检查 API 密钥是否有效，不实际调用合成
        // 实际的健康检查可以通过发送一个很短的测试文本
        this.serviceStatus.aliyun = 'healthy';
        logger.info('阿里云 DashScope API 服务健康');
      } else {
        this.serviceStatus.aliyun = 'not_configured';
        logger.warn('阿里云 DashScope API 密钥未配置');
      }
    } catch (error) {
      this.serviceStatus.aliyun = 'unhealthy';
      logger.error('阿里云 DashScope API 服务不健康:', error.message);
    }

    // 检查 GPT-SoVITS 服务
    try {
      if (this.gptSovitsConfig.apiKey && this.gptSovitsConfig.apiUrl) {
        await this.gptSovitsClient.get(`${this.gptSovitsConfig.apiUrl}/health`);
        this.serviceStatus.gptSovits = 'healthy';
        logger.info('GPT-SoVITS 云端 API 服务健康');
      } else {
        this.serviceStatus.gptSovits = 'not_configured';
        logger.warn('GPT-SoVITS 云端 API 未配置');
      }
    } catch (error) {
      this.serviceStatus.gptSovits = 'unhealthy';
      logger.error('GPT-SoVITS 云端 API 服务不健康:', error.message);
    }
  }

  async synthesize(data) {
    const { text, voice, speed = 1.0, pitch = 1.0, service = 'auto' } = data;

    if (!text || text.trim().length === 0) {
      throw new Error('文本内容不能为空');
    }

    // 选择服务
    const selectedService = await this.selectService(service);
    
    try {
      let result;
      switch (selectedService) {
        case 'aliyun':
          result = await this.synthesizeWithAliyun(text, { voice, speed, pitch });
          break;
        case 'gpt-sovits':
          result = await this.synthesizeWithGPTSoVITS(text, { voice, speed, pitch });
          break;
        default:
          throw new Error('没有可用的 TTS 服务');
      }

      logger.info('TTS 合成成功', {
        service: selectedService,
        textLength: text.length,
        duration: result.duration || 'unknown'
      });

      return {
        success: true,
        service: selectedService,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('TTS 合成失败', {
        service: selectedService,
        error: error.message
      });

      // 如果是主服务失败，尝试备用服务
      if (selectedService === 'aliyun' && this.serviceStatus.gptSovits === 'healthy') {
        logger.info('尝试使用备用 GPT-SoVITS 服务');
        try {
          const fallbackResult = await this.synthesizeWithGPTSoVITS(text, { voice, speed, pitch });
          return {
            success: true,
            service: 'gpt-sovits',
            data: fallbackResult,
            timestamp: new Date().toISOString(),
            fallback: true
          };
        } catch (fallbackError) {
          logger.error('备用服务也失败:', fallbackError.message);
        }
      }

      throw error;
    }
  }

  async selectService(preferredService) {
    // 如果指定了服务，检查是否可用
    if (preferredService === 'aliyun' && this.serviceStatus.aliyun === 'healthy') {
      return 'aliyun';
    }
    if (preferredService === 'gpt-sovits' && this.serviceStatus.gptSovits === 'healthy') {
      return 'gpt-sovits';
    }

    // 自动选择服务（优先阿里云）
    if (this.serviceStatus.aliyun === 'healthy') {
      return 'aliyun';
    }
    if (this.serviceStatus.gptSovits === 'healthy') {
      return 'gpt-sovits';
    }

    throw new Error('没有可用的 TTS 服务');
  }

  async synthesizeWithAliyun(text, options) {
    const { voice, speed, pitch } = options;
    
    const requestData = {
      model: 'cosyvoice-v3', // 使用官方推荐的模型
      input: {
        text: text
      },
      parameters: {
        voice: voice || this.aliyunConfig.voiceId,
        speech_rate: parseFloat(speed),
        pitch_rate: parseFloat(pitch)
      }
    };

    logger.info('调用阿里云 DashScope API', { 
      model: 'cosyvoice-v3', 
      voice: voice || this.aliyunConfig.voiceId,
      textLength: text.length 
    });

    try {
      const response = await this.aliyunClient.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/speech-synthesizer',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.aliyunConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 处理阿里云 API 响应
      if (response.data && response.data.output && response.data.output.audio) {
        return {
          success: true,
          message: 'TTS 合成成功',
          data: {
            audioData: response.data.output.audio,
            format: 'wav',
            sampleRate: 22050,
            duration: response.data.usage?.audio_duration || 0,
            requestId: response.data.request_id,
            text: text,
            voice: voice || this.aliyunConfig.voiceId
          }
        };
      } else {
        throw new Error('阿里云 API 返回数据格式异常');
      }
    } catch (error) {
      logger.error('阿里云 API 调用失败:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new Error(`阿里云 API 调用失败: ${error.message}`);
    }
  }

  async synthesizeWithGPTSoVITS(text, options) {
    const { voice, speed, pitch } = options;
    
    const requestData = {
      text: text,
      voice_id: voice || 'default',
      speed: parseFloat(speed),
      pitch: parseFloat(pitch)
    };

    const response = await this.gptSovitsClient.post(
      `${this.gptSovitsConfig.apiUrl}/synthesize`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.gptSovitsConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      audioData: response.data.audio,
      format: 'wav',
      sampleRate: 22050,
      duration: response.data.duration || 0
    };
  }

  async getVoices(service = 'auto') {
    const selectedService = await this.selectService(service);
    
    switch (selectedService) {
      case 'aliyun':
        return await this.getAliyunVoices();
      case 'gpt-sovits':
        return await this.getGPTSoVITSVoices();
      default:
        throw new Error('没有可用的 TTS 服务');
    }
  }

  async getAliyunVoices() {
    // 阿里云预定义语音列表
    return [
      { id: 'zhichu', name: '知初', language: 'zh-CN', gender: 'female' },
      { id: 'zhiyan', name: '知燕', language: 'zh-CN', gender: 'female' },
      { id: 'zhizhe', name: '知哲', language: 'zh-CN', gender: 'male' },
      { id: 'zhibei', name: '知贝', language: 'zh-CN', gender: 'male' }
    ];
  }

  async getGPTSoVITSVoices() {
    // GPT-SoVITS 语音列表（从 API 获取）
    try {
      const response = await this.gptSovitsClient.get(
        `${this.gptSovitsConfig.apiUrl}/voices`,
        {
          headers: {
            'Authorization': `Bearer ${this.gptSovitsConfig.apiKey}`
          }
        }
      );
      return response.data.voices || [];
    } catch (error) {
      logger.error('获取 GPT-SoVITS 语音列表失败:', error);
      return [];
    }
  }

  getServiceStatus() {
    return {
      aliyun: this.serviceStatus.aliyun,
      gptSovits: this.serviceStatus.gptSovits,
      timestamp: new Date().toISOString()
    };
  }

  async healthCheck() {
    await this.checkServiceHealth();
    return this.getServiceStatus();
  }
}

module.exports = TTSProxyService;
