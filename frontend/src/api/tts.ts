import api from './index'

export interface TTSRequest {
  text: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
}

export interface TTSResponse {
  success: boolean
  message: string
  data?: {
    audioData: string
    format: string
    sampleRate: number
    duration: number
    requestId: string
    text: string
    voice: string
  }
}

export interface VoiceInfo {
  id: string
  name: string
  language: string
  gender: 'male' | 'female'
  description: string
}

export const ttsApi = {
  // 语音合成
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const response = await api.post('/tts/synthesize', request)
    return response.data
  },

  // 获取可用语音列表
  async getVoices(): Promise<VoiceInfo[]> {
    const response = await api.get('/tts/voices')
    return response.data
  },

  // 获取语音信息
  async getVoiceInfo(voiceId: string): Promise<VoiceInfo> {
    const response = await api.get(`/tts/voices/${voiceId}`)
    return response.data
  },

  // 检查 TTS 服务状态
  async checkStatus(): Promise<{ status: string; services: any }> {
    const response = await api.get('/tts/status')
    return response.data
  }
}
