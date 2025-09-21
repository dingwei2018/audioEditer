import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AudioTrack, SegmentGap, TextSegment, PauseMark, PronunciationMark } from '@/models/Audio'
import { createAudioTrack, createSegmentGap } from '@/models/Audio'

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
    const newTrack = createAudioTrack(
      track.name,
      track.text,
      track.voice,
      track.speed,
      track.pitch,
      track.volume
    )
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

  // 更新句子语音设置的方法
  const updateSegmentVoiceSettings = (
    trackId: string, 
    segmentId: string, 
    settings: {
      voice?: string
      speed?: number
      pitch?: number
      volume?: number
      ssml?: string
      pauseMarks?: PauseMark[]
      pronunciationMarks?: PronunciationMark[]
    }
  ) => {
    console.log('=== AudioStore - updateSegmentVoiceSettings START ===')
    console.log('trackId:', trackId)
    console.log('segmentId:', segmentId)
    console.log('settings to save:', settings)
    
    const track = tracks.value.find(track => track.id === trackId)
    console.log('found track:', track?.id)
    
    if (track && track.segments) {
      const segment = track.segments.find(seg => seg.id === segmentId)
      console.log('found segment:', segment?.id, segment?.text)
      
      if (segment) {
        console.log('segment before update:', {
          voice: segment.voice,
          speed: segment.speed,
          pitch: segment.pitch,
          volume: segment.volume,
          pauseMarks: segment.pauseMarks,
          pronunciationMarks: segment.pronunciationMarks
        })
        
        // 更新语音设置
        if (settings.voice !== undefined) {
          console.log('AudioStore - updating voice:', settings.voice)
          segment.voice = settings.voice
        }
        if (settings.speed !== undefined) {
          console.log('AudioStore - updating speed:', settings.speed)
          segment.speed = settings.speed
        }
        if (settings.pitch !== undefined) {
          console.log('AudioStore - updating pitch:', settings.pitch)
          segment.pitch = settings.pitch
        }
        if (settings.volume !== undefined) {
          console.log('AudioStore - updating volume:', settings.volume)
          segment.volume = settings.volume
        }
        if (settings.ssml !== undefined) {
          console.log('AudioStore - updating ssml:', settings.ssml)
          segment.ssml = settings.ssml
        }
        if (settings.pauseMarks !== undefined) {
          console.log('AudioStore - updating pauseMarks:', settings.pauseMarks)
          console.log('AudioStore - pauseMarks type:', typeof settings.pauseMarks)
          console.log('AudioStore - pauseMarks length:', settings.pauseMarks?.length)
          console.log('AudioStore - pauseMarks content:', settings.pauseMarks)
          segment.pauseMarks = settings.pauseMarks
          console.log('AudioStore - segment.pauseMarks after assignment:', segment.pauseMarks)
        }
        if (settings.pronunciationMarks !== undefined) {
          console.log('AudioStore - updating pronunciationMarks:', settings.pronunciationMarks)
          segment.pronunciationMarks = settings.pronunciationMarks
        }
        
        console.log('segment after update:', {
          voice: segment.voice,
          speed: segment.speed,
          pitch: segment.pitch,
          volume: segment.volume,
          pauseMarks: segment.pauseMarks,
          pronunciationMarks: segment.pronunciationMarks
        })
        console.log('pauseMarks array length:', segment.pauseMarks?.length)
        console.log('pronunciationMarks array length:', segment.pronunciationMarks?.length)
        console.log('pauseMarks array content:', segment.pauseMarks)
        console.log('pronunciationMarks array content:', segment.pronunciationMarks)
        
        console.log('AudioStore - segment voice settings updated successfully')
      } else {
        console.error('AudioStore - segment not found:', segmentId)
      }
    } else {
      console.error('AudioStore - track not found or no segments:', trackId)
    }
    
    console.log('=== AudioStore - updateSegmentVoiceSettings END ===')
  }

  // 从SSML中解析停顿标记的函数
  const parsePauseMarksFromSSML = (ssml: string, text: string) => {
    if (!ssml || !text) return []
    
    const pauseMarks: any[] = []
    const breakRegex = /<break\s+time="(\d+(?:\.\d+)?)s?"\s*\/?>/g
    let match
    let currentIndex = 0
    
    // 找到所有break标签
    while ((match = breakRegex.exec(ssml)) !== null) {
      const breakTag = match[0]
      const duration = parseFloat(match[1])
      
      // 找到break标签在SSML中的位置
      const breakIndex = ssml.indexOf(breakTag, currentIndex)
      
      // 计算对应的文本位置
      const textBeforeBreak = ssml.substring(0, breakIndex)
      // 移除所有SSML标签，只保留纯文本
      const cleanTextBeforeBreak = textBeforeBreak.replace(/<[^>]*>/g, '')
      
      // 找到在原始文本中的位置
      const charIndex = Math.min(cleanTextBeforeBreak.length, text.length - 1)
      
      pauseMarks.push({
        charIndex: charIndex,
        duration: duration
      })
      
      currentIndex = breakIndex + breakTag.length
    }
    
    return pauseMarks
  }

  // 获取句子语音设置的方法
  const getSegmentVoiceSettings = (trackId: string, segmentId: string) => {
    // 全局测试
    ;(window as any).testAudioStoreCall = true
    ;(window as any).testAudioStoreParams = { trackId, segmentId }
    
    console.log('🚨🚨🚨 AudioStore getSegmentVoiceSettings called! 🚨🚨🚨')
    console.log('🔍 AudioStore getSegmentVoiceSettings called!')
    console.log('=== AudioStore - getSegmentVoiceSettings START ===')
    console.log('trackId:', trackId)
    console.log('segmentId:', segmentId)
    
    const track = tracks.value.find(track => track.id === trackId)
    console.log('found track:', track?.id)
    
    if (track && track.segments) {
      const segment = track.segments.find(seg => seg.id === segmentId)
      console.log('found segment:', segment?.id, segment?.text)
      
      if (segment) {
        const settings = {
          voice: segment.voice,
          speed: segment.speed,
          pitch: segment.pitch,
          volume: segment.volume,
          ssml: segment.ssml,
          pauseMarks: segment.pauseMarks || [],
          pronunciationMarks: segment.pronunciationMarks || []
        }
        
        console.log('retrieved settings:', settings)
        console.log('segment.pauseMarks raw:', segment.pauseMarks)
        console.log('segment.pronunciationMarks raw:', segment.pronunciationMarks)
        console.log('segment.pauseMarks length:', segment.pauseMarks?.length)
        console.log('segment.pronunciationMarks length:', segment.pronunciationMarks?.length)
        console.log('segment.pauseMarks type:', typeof segment.pauseMarks)
        console.log('segment.pronunciationMarks type:', typeof segment.pronunciationMarks)
        console.log('=== AudioStore - getSegmentVoiceSettings END ===')
        return settings
      }
    }
    
    console.log('no settings found, returning null')
    console.log('=== AudioStore - getSegmentVoiceSettings END ===')
    return null
  }

  // 间隔管理方法
  const addGap = (trackId: string, beforeSegmentId: string, afterSegmentId: string, duration: number = 1) => {

    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.isSegmented) {
      if (!track.gaps) {
        track.gaps = []
      }

      // 确保 duration 是有效数字
      const safeDuration = isNaN(duration) ? 1 : Number(duration)
      const gap: SegmentGap = createSegmentGap(beforeSegmentId, afterSegmentId, safeDuration)
      track.gaps.push(gap)
    }
  }

  const updateGapDuration = (trackId: string, gapId: string, duration: number) => {

    const track = tracks.value.find(t => t.id === trackId)

    if (track && track.gaps) {

      // 先清理所有现有的 NaN 数据
      track.gaps.forEach((g, index) => {
        if (isNaN(g.duration)) {
          g.duration = 1
        }
      })

      const gap = track.gaps.find(g => g.id === gapId)

      if (gap) {
        const oldDuration = gap.duration
        // 确保输入的 duration 是有效数字
        const safeDuration = isNaN(duration) ? 1 : Math.max(0, Number(duration))
        gap.duration = safeDuration
      } else {
        console.error('Gap not found with gapId:', gapId)
      }
    } else {
      console.error('Track not found or has no gaps')
    }

  }

  const removeGap = (trackId: string, gapId: string) => {

    const track = tracks.value.find(t => t.id === trackId)

    if (track && track.gaps) {

      const index = track.gaps.findIndex(g => g.id === gapId)

      if (index > -1) {
        const removedGap = track.gaps[index]

        // 创建删除间隔的唯一标识
        const deletedGapKey = `${removedGap.beforeSegmentId}->${removedGap.afterSegmentId}`

        // 初始化 deletedGaps 数组
        if (!track.deletedGaps) {
          track.deletedGaps = []
        }

        // 记录用户删除的间隔，防止重新创建
        if (!track.deletedGaps.includes(deletedGapKey)) {
          track.deletedGaps.push(deletedGapKey)
        }

        track.gaps.splice(index, 1)
      } else {
        console.error('Gap not found with gapId:', gapId)
      }
    } else {
      console.error('Track not found or has no gaps')
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
      } else {
      }

      // 确保 deletedGaps 数组存在
      if (!track.deletedGaps) {
        track.deletedGaps = []
      }


      // 为每对相邻分句创建间隔
      for (let i = 0; i < track.segments.length - 1; i++) {
        const beforeSegmentId = track.segments[i].id
        const afterSegmentId = track.segments[i + 1].id
        const gapKey = `${beforeSegmentId}->${afterSegmentId}`


        // 检查用户是否已经主动删除了这个间隔
        if (track.deletedGaps.includes(gapKey)) {
          continue
        }

        // 检查是否已存在间隔
        const existingGap = track.gaps.find(gap =>
          gap.beforeSegmentId === beforeSegmentId && gap.afterSegmentId === afterSegmentId
        )

        if (!existingGap) {
          addGap(trackId, beforeSegmentId, afterSegmentId, 1) // 默认1秒间隔
        } else {
        }
      }
    } else {
    }

  }

  // 清理所有 NaN 数据的函数
  const cleanupNaNData = () => {
    let fixedCount = 0

    tracks.value.forEach((track, trackIndex) => {
      if (track.gaps && track.gaps.length > 0) {

        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            gap.duration = 1
            fixedCount++
          }
        })
      }
    })

    return fixedCount
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
    updateSegmentVoiceSettings,
    getSegmentVoiceSettings,
    // 间隔管理方法
    addGap,
    updateGapDuration,
    removeGap,
    selectGap,
    initializeGaps,
    cleanupNaNData
  }
})
