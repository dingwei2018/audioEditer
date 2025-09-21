import { mockTtsApi } from '@/mock/api'

export interface SynthesisRequest {
  text: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  format?: 'mp3' | 'wav' | 'aac'
  sampleRate?: number
}

export interface SynthesisResponse {
  audioUrl: string
  duration: number
  size: number
  format: string
  taskId?: string
}

export interface VoiceInfo {
  id: string
  name: string
  gender: 'male' | 'female'
  ageGroup: 'child' | 'young' | 'adult' | 'elder'
  style: string
  language: 'zh-CN' | 'en-US' | 'ja-JP'
  category: string
  avatar: string
  description: string
  ssmlName: string
  previewUrl?: string
}

export const ttsApi = {
  // 获取可用音色列表
  async getVoices(): Promise<VoiceInfo[]> {
    const response = await mockTtsApi.getVoices()
    if (!response.success) {
      throw new Error(response.error || '获取音色列表失败')
    }
    return response.data! as VoiceInfo[]
  },

  // 合成单句语音
  async synthesizeText(request: SynthesisRequest): Promise<SynthesisResponse> {
    const response = await mockTtsApi.synthesizeText(request)
    if (!response.success) {
      throw new Error(response.error || '语音合成失败')
    }
    return response.data!
  },

  // 批量合成语音
  async batchSynthesize(requests: SynthesisRequest[]): Promise<SynthesisResponse[]> {
    const response = await mockTtsApi.batchSynthesize(requests)
    if (!response.success) {
      throw new Error(response.error || '批量语音合成失败')
    }
    return response.data!
  },

  // 获取合成任务状态
  async getTaskStatus(taskId: string): Promise<{ status: string; progress: number; result?: SynthesisResponse }> {
    const response = await mockTtsApi.getTaskStatus(taskId)
    if (!response.success) {
      throw new Error(response.error || '获取任务状态失败')
    }
    return response.data!
  },

  // 预览音色
  async previewVoice(voiceId: string, text?: string): Promise<{ audioUrl: string }> {
    const response = await mockTtsApi.previewVoice(voiceId, text)
    if (!response.success) {
      throw new Error(response.error || '音色预览失败')
    }
    return response.data!
  },

  // 获取音色分类
  async getVoiceCategories(): Promise<Array<{ id: string; name: string; description: string }>> {
    const response = await mockTtsApi.getVoiceCategories()
    if (!response.success) {
      throw new Error(response.error || '获取音色分类失败')
    }
    return response.data!
  },

  // 检查 TTS 服务状态（兼容原有接口）
  async checkStatus(): Promise<{ status: string; services: any }> {
    return {
      status: 'running',
      services: {
        dashscope: { status: 'available', version: 'mock-v1.0' },
        'gpt-sovits': { status: 'available', version: 'mock-v1.0' }
      }
    }
  }
}

// 默认导出
export default ttsApi