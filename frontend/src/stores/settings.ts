import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings, TTSSettings } from '@/models/Settings'
import { createDefaultAppSettings, createDefaultTTSSettings } from '@/models/Settings'

export interface AudioSettings {
  outputFormat: 'mp3' | 'wav' | 'aac'
  sampleRate: number
  bitRate: number
  channels: number
  normalize: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const ttsSettings = ref<TTSSettings>(createDefaultTTSSettings())

  const audioSettings = ref<AudioSettings>({
    outputFormat: 'mp3',
    sampleRate: 44100,
    bitRate: 128,
    channels: 2,
    normalize: true
  })

  const uiSettings = ref<AppSettings>(createDefaultAppSettings())

  // 操作
  const updateTTSSettings = (settings: Partial<TTSSettings>) => {
    Object.assign(ttsSettings.value, settings)
    saveSettings()
  }

  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    Object.assign(audioSettings.value, settings)
    saveSettings()
  }

  const updateUISettings = (settings: Partial<AppSettings>) => {
    Object.assign(uiSettings.value, settings)
    saveSettings()
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('ttsSettings', JSON.stringify(ttsSettings.value))
      localStorage.setItem('audioSettings', JSON.stringify(audioSettings.value))
      localStorage.setItem('uiSettings', JSON.stringify(uiSettings.value))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const loadSettings = () => {
    try {
      const tts = localStorage.getItem('ttsSettings')
      if (tts) {
        ttsSettings.value = { ...ttsSettings.value, ...JSON.parse(tts) }
      }

      const audio = localStorage.getItem('audioSettings')
      if (audio) {
        audioSettings.value = { ...audioSettings.value, ...JSON.parse(audio) }
      }

      const ui = localStorage.getItem('uiSettings')
      if (ui) {
        uiSettings.value = { ...uiSettings.value, ...JSON.parse(ui) }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const resetSettings = () => {
    ttsSettings.value = createDefaultTTSSettings()

    audioSettings.value = {
      outputFormat: 'mp3',
      sampleRate: 44100,
      bitRate: 128,
      channels: 2,
      normalize: true
    }

    uiSettings.value = createDefaultAppSettings()

    saveSettings()
  }

  // 初始化
  const init = () => {
    loadSettings()
  }

  return {
    // 状态
    ttsSettings,
    audioSettings,
    uiSettings,
    // 操作
    updateTTSSettings,
    updateAudioSettings,
    updateUISettings,
    saveSettings,
    loadSettings,
    resetSettings,
    init
  }
})
