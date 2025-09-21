export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  autoSaveInterval: number
  playbackVolume: number
  keyboardShortcuts: boolean
}

export interface UserInterface {
  sidebarCollapsed: boolean
  timelineHeight: number
  segmentEditorVisible: boolean
  settingsDialogVisible: boolean
}

export interface TTSSettings {
  provider?: 'aliyun' | 'gpt-sovits'
  apiKey?: string
  apiUrl?: string
  defaultVoice: string
  defaultSpeed: number
  defaultPitch: number
  defaultVolume: number
  outputFormat: 'mp3' | 'wav' | 'aac'
  sampleRate: number
  bitRate: number
}

export const createDefaultAppSettings = (): AppSettings => {
  return {
    theme: 'auto',
    language: 'zh-CN',
    autoSave: true,
    autoSaveInterval: 30000,
    playbackVolume: 1.0,
    keyboardShortcuts: true
  }
}

export const createDefaultTTSSettings = (): TTSSettings => {
  return {
    provider: 'aliyun',
    apiKey: '',
    apiUrl: '',
    defaultVoice: 'zhiyu',
    defaultSpeed: 1.0,
    defaultPitch: 1.0,
    defaultVolume: 1.0,
    outputFormat: 'mp3',
    sampleRate: 44100,
    bitRate: 128
  }
}