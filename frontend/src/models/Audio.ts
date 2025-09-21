export interface TextSegment {
  id: string
  text: string
  startIndex: number
  endIndex: number
  type: 'sentence' | 'paragraph' | 'custom'
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
}

export interface AudioTrack {
  id: string
  name: string
  text: string
  voice: string
  speed: number
  pitch: number
  volume: number
  audioUrl?: string
  duration?: number
  isPlaying: boolean
  isSynthesizing: boolean
  segments?: TextSegment[]
  isSegmented: boolean
  segmentMethod?: 'punctuation' | 'paragraph' | 'ai'
  gaps?: SegmentGap[]
}

export interface SegmentGap {
  id: string
  beforeSegmentId: string
  afterSegmentId: string
  duration: number
  isSelected: boolean
}

export interface VoiceModel {
  id: string
  name: string
  gender: 'male' | 'female'
  ageGroup: 'child' | 'young' | 'adult' | 'elder'
  style: string
  language: 'zh-CN' | 'en-US' | 'ja-JP'
  sampleUrl?: string
}

export const createAudioTrack = (
  name: string,
  text: string,
  voice = 'default',
  speed = 1.0,
  pitch = 1.0,
  volume = 1.0
): AudioTrack => {
  return {
    id: Date.now().toString(),
    name,
    text,
    voice,
    speed,
    pitch,
    volume,
    isPlaying: false,
    isSynthesizing: false,
    isSegmented: false
  }
}

export const createTextSegment = (
  text: string,
  startIndex: number,
  endIndex: number,
  type: 'sentence' | 'paragraph' | 'custom' = 'sentence'
): TextSegment => {
  return {
    id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    startIndex,
    endIndex,
    type
  }
}

export const createSegmentGap = (
  beforeSegmentId: string,
  afterSegmentId: string,
  duration = 1
): SegmentGap => {
  return {
    id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    beforeSegmentId,
    afterSegmentId,
    duration,
    isSelected: false
  }
}