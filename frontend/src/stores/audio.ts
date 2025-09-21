import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TextSegment } from '@/utils/textSegmentation'

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
  // 新增分句相关字段
  segments?: TextSegment[]
  isSegmented: boolean
  segmentMethod?: 'punctuation' | 'paragraph' | 'ai'
  // 新增间隔时间字段
  gaps?: SegmentGap[]
}

export interface SegmentGap {
  id: string
  beforeSegmentId: string // 在哪个分句之前
  afterSegmentId: string // 在哪个分句之后
  duration: number // 间隔时长（秒）
  isSelected: boolean
}

export const useAudioStore = defineStore('audio', () => {
  // 状态
  const tracks = ref<AudioTrack[]>([])
  const currentTrackId = ref<string>('')
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)

  // 本地存储键名（暂时未使用，保留用于未来功能）
  // const STORAGE_KEY = 'audio-editor-tracks'

  // 计算属性
  const currentTrack = computed(() => {
    return tracks.value.find(track => track.id === currentTrackId.value)
  })

  const hasTracks = computed(() => {
    return tracks.value.length > 0
  })

  const totalDuration = computed(() => {
    return tracks.value.reduce((total, track) => total + (track.duration || 0), 0)
  })

  // 操作
  const addTrack = (track: Omit<AudioTrack, 'id' | 'isPlaying' | 'isSynthesizing' | 'isSegmented'>) => {
    const newTrack: AudioTrack = {
      ...track,
      id: Date.now().toString(),
      isPlaying: false,
      isSynthesizing: false,
      isSegmented: false
    }
    tracks.value.push(newTrack)
    if (!currentTrackId.value) {
      currentTrackId.value = newTrack.id
    }
    return newTrack.id
  }

  const removeTrack = (id: string) => {
    const index = tracks.value.findIndex(track => track.id === id)
    if (index > -1) {
      tracks.value.splice(index, 1)
      if (currentTrackId.value === id) {
        currentTrackId.value = tracks.value[0]?.id || ''
      }
    }
  }

  const updateTrack = (id: string, updates: Partial<AudioTrack>) => {
    const track = tracks.value.find(track => track.id === id)
    if (track) {
      Object.assign(track, updates)
    }
  }

  const setCurrentTrack = (id: string) => {
    currentTrackId.value = id
  }

  const playTrack = (id: string) => {
    // 停止所有其他轨道
    tracks.value.forEach(track => {
      if (track.id !== id) {
        track.isPlaying = false
      }
    })
    
    const track = tracks.value.find(track => track.id === id)
    if (track) {
      track.isPlaying = true
      isPlaying.value = true
    }
  }

  const pauseTrack = (id: string) => {
    const track = tracks.value.find(track => track.id === id)
    if (track) {
      track.isPlaying = false
      isPlaying.value = false
    }
  }

  const stopAllTracks = () => {
    tracks.value.forEach(track => {
      track.isPlaying = false
    })
    isPlaying.value = false
    currentTime.value = 0
  }

  const clearTracks = () => {
    tracks.value = []
    currentTrackId.value = ''
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }

  // 分句相关方法
  const segmentTrack = (trackId: string, segments: TextSegment[], method: 'punctuation' | 'paragraph' | 'ai') => {
    const track = tracks.value.find(track => track.id === trackId)
    if (track) {
      track.segments = segments
      track.isSegmented = true
      track.segmentMethod = method
    }
  }

  const unsegmentTrack = (trackId: string) => {
    const track = tracks.value.find(track => track.id === trackId)
    if (track) {
      track.segments = undefined
      track.isSegmented = false
      track.segmentMethod = undefined
    }
  }

  const updateSegmentText = (trackId: string, segmentId: string, newText: string) => {
    const track = tracks.value.find(track => track.id === trackId)
    if (track && track.segments) {
      const segment = track.segments.find(seg => seg.id === segmentId)
      if (segment) {
        segment.text = newText
        // 重新计算整个轨道的文本
        track.text = track.segments.map(seg => seg.text).join(' ')
      }
    }
  }

  const removeSegment = (trackId: string, segmentId: string) => {
    const track = tracks.value.find(track => track.id === trackId)
    if (track && track.segments) {
      const index = track.segments.findIndex(seg => seg.id === segmentId)
      if (index > -1) {
        track.segments.splice(index, 1)
        // 重新计算整个轨道的文本
        track.text = track.segments.map(seg => seg.text).join(' ')
      }
    }
  }

  const addSegment = (trackId: string, segment: TextSegment) => {
    const track = tracks.value.find(track => track.id === trackId)
    if (track && track.segments) {
      track.segments.push(segment)
      // 重新计算整个轨道的文本
      track.text = track.segments.map(seg => seg.text).join(' ')
    }
  }

  // 间隔管理方法
  const addGap = (trackId: string, beforeSegmentId: string, afterSegmentId: string, duration: number = 1) => {
    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.isSegmented) {
      if (!track.gaps) {
        track.gaps = []
      }
      
      const gapId = `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const gap: SegmentGap = {
        id: gapId,
        beforeSegmentId,
        afterSegmentId,
        duration,
        isSelected: false
      }
      
      track.gaps.push(gap)
    }
  }

  const updateGapDuration = (trackId: string, gapId: string, duration: number) => {
    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.gaps) {
      const gap = track.gaps.find(g => g.id === gapId)
      if (gap) {
        gap.duration = Math.max(0, duration) // 确保间隔时间不为负数
      }
    }
  }

  const removeGap = (trackId: string, gapId: string) => {
    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.gaps) {
      const index = track.gaps.findIndex(g => g.id === gapId)
      if (index > -1) {
        track.gaps.splice(index, 1)
      }
    }
  }

  const selectGap = (trackId: string, gapId: string) => {
    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.gaps) {
      // 取消所有间隔的选中状态
      track.gaps.forEach(gap => gap.isSelected = false)
      // 选中指定间隔
      const gap = track.gaps.find(g => g.id === gapId)
      if (gap) {
        gap.isSelected = true
      }
    }
  }

  const initializeGaps = (trackId: string) => {
    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.isSegmented && track.segments && track.segments.length > 1) {
      if (!track.gaps) {
        track.gaps = []
      }
      
      // 为每对相邻分句创建间隔
      for (let i = 0; i < track.segments.length - 1; i++) {
        const beforeSegmentId = track.segments[i].id
        const afterSegmentId = track.segments[i + 1].id
        
        // 检查是否已存在间隔
        const existingGap = track.gaps.find(gap => 
          gap.beforeSegmentId === beforeSegmentId && gap.afterSegmentId === afterSegmentId
        )
        
        if (!existingGap) {
          addGap(trackId, beforeSegmentId, afterSegmentId, 1) // 默认1秒间隔
        }
      }
    }
  }

  return {
    // 状态
    tracks,
    currentTrackId,
    isPlaying,
    currentTime,
    duration,
    volume,
    // 计算属性
    currentTrack,
    hasTracks,
    totalDuration,
    // 操作
    addTrack,
    removeTrack,
    updateTrack,
    setCurrentTrack,
    playTrack,
    pauseTrack,
    stopAllTracks,
    clearTracks,
    // 分句相关方法
    segmentTrack,
    unsegmentTrack,
    updateSegmentText,
    removeSegment,
    addSegment,
    // 间隔管理方法
    addGap,
    updateGapDuration,
    removeGap,
    selectGap,
    initializeGaps
  }
})
