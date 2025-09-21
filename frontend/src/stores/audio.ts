import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AudioTrack, SegmentGap, TextSegment } from '@/models/Audio'
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
    console.log('AudioStore - updateSegmentText:', trackId, segmentId, newText)
    const track = tracks.value.find(track => track.id === trackId)
    if (track && track.segments) {
      const segment = track.segments.find(seg => seg.id === segmentId)
      if (segment) {
        console.log('AudioStore - segment found, updating text from:', segment.text, 'to:', newText)
        segment.text = newText
        // 重新计算整个轨道的文本
        track.text = track.segments.map(seg => seg.text).join(' ')
        console.log('AudioStore - track text updated to:', track.text)
      } else {
        console.error('AudioStore - segment not found:', segmentId)
      }
    } else {
      console.error('AudioStore - track not found or no segments:', trackId)
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
    console.log('=== AudioStore - addGap START ===')
    console.log('trackId:', trackId)
    console.log('beforeSegmentId:', beforeSegmentId)
    console.log('afterSegmentId:', afterSegmentId)
    console.log('duration:', duration, 'type:', typeof duration)
    console.log('duration is NaN?', isNaN(duration))

    const track = tracks.value.find(t => t.id === trackId)
    if (track && track.isSegmented) {
      if (!track.gaps) {
        track.gaps = []
      }

      // 确保 duration 是有效数字
      const safeDuration = isNaN(duration) ? 1 : Number(duration)
      console.log('safeDuration after check:', safeDuration)

      const gap: SegmentGap = createSegmentGap(beforeSegmentId, afterSegmentId, safeDuration)
      console.log('Created gap:', gap)

      track.gaps.push(gap)
      console.log('Gap added to track, total gaps:', track.gaps.length)
    } else {
      console.error('Track not found or not segmented')
    }

    console.log('=== AudioStore - addGap END ===')
  }

  const updateGapDuration = (trackId: string, gapId: string, duration: number) => {
    console.log('=== AudioStore - updateGapDuration START ===')
    console.log('trackId:', trackId)
    console.log('gapId:', gapId)
    console.log('duration:', duration)
    console.log('duration type:', typeof duration)
    console.log('duration is NaN?', isNaN(duration))

    const track = tracks.value.find(t => t.id === trackId)
    console.log('Found track:', track ? track.id : 'NOT FOUND')

    if (track && track.gaps) {
      console.log('Track has gaps:', track.gaps.length)

      // 先清理所有现有的 NaN 数据
      track.gaps.forEach((g, index) => {
        if (isNaN(g.duration)) {
          console.log(`WARNING: Found NaN duration in gap ${index}, fixing to 1`)
          g.duration = 1
        }
        console.log(`  Gap ${index}: id=${g.id}, beforeSegmentId=${g.beforeSegmentId}, duration=${g.duration} (type: ${typeof g.duration})`)
      })

      const gap = track.gaps.find(g => g.id === gapId)
      console.log('Found gap by gapId:', gap ? gap : 'NOT FOUND')

      if (gap) {
        const oldDuration = gap.duration
        // 确保输入的 duration 是有效数字
        const safeDuration = isNaN(duration) ? 1 : Math.max(0, Number(duration))
        gap.duration = safeDuration
        console.log('Gap duration updated from', oldDuration, 'to', gap.duration)
        console.log('Updated duration type:', typeof gap.duration, 'isNaN:', isNaN(gap.duration))
      } else {
        console.error('Gap not found with gapId:', gapId)
      }
    } else {
      console.error('Track not found or has no gaps')
    }

    console.log('=== AudioStore - updateGapDuration END ===')
  }

  const removeGap = (trackId: string, gapId: string) => {
    console.log('=== AudioStore - removeGap START ===')
    console.log('trackId:', trackId)
    console.log('gapId:', gapId)

    const track = tracks.value.find(t => t.id === trackId)
    console.log('Found track:', track ? track.id : 'NOT FOUND')

    if (track && track.gaps) {
      console.log('Track has gaps:', track.gaps.length)

      const index = track.gaps.findIndex(g => g.id === gapId)
      console.log('Gap index to remove:', index)

      if (index > -1) {
        const removedGap = track.gaps[index]
        console.log('Removing gap:', removedGap)

        // 创建删除间隔的唯一标识
        const deletedGapKey = `${removedGap.beforeSegmentId}->${removedGap.afterSegmentId}`

        // 初始化 deletedGaps 数组
        if (!track.deletedGaps) {
          track.deletedGaps = []
        }

        // 记录用户删除的间隔，防止重新创建
        if (!track.deletedGaps.includes(deletedGapKey)) {
          track.deletedGaps.push(deletedGapKey)
          console.log('Added to deletedGaps:', deletedGapKey)
        }

        track.gaps.splice(index, 1)
        console.log('Gap removed successfully, remaining gaps:', track.gaps.length)
        console.log('Deleted gaps list:', track.deletedGaps)
      } else {
        console.error('Gap not found with gapId:', gapId)
      }
    } else {
      console.error('Track not found or has no gaps')
    }

    console.log('=== AudioStore - removeGap END ===')
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
    console.log('=== AudioStore - initializeGaps START ===')
    console.log('trackId:', trackId)

    const track = tracks.value.find(t => t.id === trackId)
    console.log('Found track:', track ? track.id : 'NOT FOUND')

    if (track && track.isSegmented && track.segments && track.segments.length > 1) {
      console.log('Track has segments:', track.segments.length)

      if (!track.gaps) {
        track.gaps = []
        console.log('Initialized empty gaps array')
      } else {
        console.log('Track already has gaps:', track.gaps.length)
      }

      // 确保 deletedGaps 数组存在
      if (!track.deletedGaps) {
        track.deletedGaps = []
      }

      console.log('Current deletedGaps:', track.deletedGaps)

      // 为每对相邻分句创建间隔
      for (let i = 0; i < track.segments.length - 1; i++) {
        const beforeSegmentId = track.segments[i].id
        const afterSegmentId = track.segments[i + 1].id
        const gapKey = `${beforeSegmentId}->${afterSegmentId}`

        console.log(`Checking gap ${i}: ${gapKey}`)

        // 检查用户是否已经主动删除了这个间隔
        if (track.deletedGaps.includes(gapKey)) {
          console.log(`Skipping gap ${i} - user deleted: ${gapKey}`)
          continue
        }

        // 检查是否已存在间隔
        const existingGap = track.gaps.find(gap =>
          gap.beforeSegmentId === beforeSegmentId && gap.afterSegmentId === afterSegmentId
        )

        if (!existingGap) {
          console.log(`Creating new gap ${i} with duration 1`)
          addGap(trackId, beforeSegmentId, afterSegmentId, 1) // 默认1秒间隔
        } else {
          console.log(`Gap ${i} already exists with duration:`, existingGap.duration)
        }
      }
    } else {
      console.log('Track not eligible for gap initialization')
    }

    console.log('=== AudioStore - initializeGaps END ===')
  }

  // 清理所有 NaN 数据的函数
  const cleanupNaNData = () => {
    console.log('=== AudioStore - cleanupNaNData START ===')
    let fixedCount = 0

    tracks.value.forEach((track, trackIndex) => {
      if (track.gaps && track.gaps.length > 0) {
        console.log(`Checking track ${trackIndex} (${track.id}) gaps:`)

        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            console.log(`  WARNING: Fixed NaN duration in gap ${gapIndex} (${gap.id})`)
            gap.duration = 1
            fixedCount++
          }
        })
      }
    })

    console.log(`=== AudioStore - cleanupNaNData END === Fixed ${fixedCount} NaN values`)
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
    // 间隔管理方法
    addGap,
    updateGapDuration,
    removeGap,
    selectGap,
    initializeGaps,
    cleanupNaNData
  }
})
