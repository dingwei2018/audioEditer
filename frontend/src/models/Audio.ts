export interface PauseMark {
  charIndex: number
  duration: number
}

export interface PronunciationMark {
  charIndex: number
  pinyin: string
}

export interface TextSegment {
  id: string
  text: string
  startIndex: number
  endIndex: number
  type: 'sentence' | 'paragraph' | 'custom' | 'ai'
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  ssml?: string
  pauseMarks?: PauseMark[]
  pronunciationMarks?: PronunciationMark[]
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
  deletedGaps?: string[] // 存储用户主动删除的间隔的唯一标识
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
  type: 'sentence' | 'paragraph' | 'custom' | 'ai' = 'sentence'
): TextSegment => {
  return {
    id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    startIndex,
    endIndex,
    type,
    // 设置默认的语音参数
    voice: 'zhichu',
    speed: 1,
    pitch: 1,
    volume: 1,
    ssml: '',
    pauseMarks: [],
    pronunciationMarks: []
  }
}

export const createSegmentGap = (
  beforeSegmentId: string,
  afterSegmentId: string,
  duration = 1
): SegmentGap => {

  // 确保 duration 是有效数字
  const safeDuration = isNaN(duration) ? 1 : Number(duration)

  const gap: SegmentGap = {
    id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    beforeSegmentId,
    afterSegmentId,
    duration: safeDuration,
    isSelected: false
  }


  return gap
}