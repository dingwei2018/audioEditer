export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

export interface TTSRequest {
  text: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  format?: 'mp3' | 'wav' | 'aac'
  sampleRate?: number
}

export interface TTSResponse {
  audioUrl: string
  duration: number
  format: string
  sampleRate: number
  size: number
}

export interface ProjectSaveRequest {
  id?: string
  name: string
  description?: string
  tracks: string[]
  settings?: any
}

export interface VoiceListResponse {
  voices: Array<{
    id: string
    name: string
    gender: 'male' | 'female'
    language: string
    style?: string
    preview?: string
  }>
}

export const createAPIResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): APIResponse<T> => {
  return {
    success,
    data,
    message,
    error
  }
}

export const createTTSRequest = (text: string, options?: Partial<TTSRequest>): TTSRequest => {
  return {
    text,
    voice: 'zhiyu',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    format: 'mp3',
    sampleRate: 44100,
    ...options
  }
}