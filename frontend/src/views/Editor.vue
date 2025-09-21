<template>
  <div class="editor">
    <div class="editor-container">
      <!-- 顶部工具栏 -->
      <EditorToolbar
        :workflow-stage="workflowStage"
        :has-tracks="hasTracks"
        @stage-change="handleStageChange"
        @save-project="saveProject"
        @export-project="exportProject"
      />

      <!-- 文本输入阶段 -->
      <TextInputStage
        v-if="workflowStage === 'input'"
        ref="textInputStageRef"
        @start-segmentation="handleStartSegmentation"
        @segmentation-confirm="handleSegmentationConfirm"
      />

      <!-- 时间轴编辑阶段 -->
      <TimelineEditStage
        v-else-if="workflowStage === 'timeline'"
        :timeline-segments="timelineSegments"
        :timeline-gaps="timelineGaps"
        :total-timeline-duration="totalTimelineDuration"
        :selected-segment-id="selectedSegmentId"
        :playing-segment-id="playingSegmentId"
        :selected-gap-id="selectedGapId"
        :show-voice-editor="showSentenceVoiceEditor"
        :selected-segment-for-voice="selectedSegmentForVoice"
        :selected-segment-index="selectedSegmentIndex"
        @select-segment="handleSelectSegment"
        @play-segment="handlePlaySegment"
        @edit-segment="handleEditSegment"
        @add-text="handleAddText"
        @update-segment-text="handleUpdateSegmentText"
        @delete-segment="handleDeleteSegment"
        @add-sentence-after="handleAddSentenceAfter"
        @add-gap="handleAddGap"
        @select-gap="handleSelectGap"
        @update-gap-duration="handleUpdateGapDuration"
        @remove-gap="handleRemoveGap"
        @open-voice-editor="handleOpenVoiceEditor"
        @synthesize-audio="handleSynthesizeAudio"
        @play-audio="handlePlayAudio"
        @ssml-update="handleSSMLUpdate"
        @voice-update="handleVoiceUpdate"
        @volume-update="handleVolumeUpdate"
        @speed-update="handleSpeedUpdate"
        @pitch-update="handlePitchUpdate"
        @update-pause-marks="handlePauseMarksUpdate"
        @update-pronunciation-marks="handlePronunciationMarksUpdate"
        @close-voice-editor="closeSentenceVoiceEditor"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useAudioStore, useProjectStore, useAppStore } from '../stores'
import { TextSegmentation } from '../utils/textSegmentation'

// 导入模块化组件
import EditorToolbar from '@/modules/editor/components/EditorToolbar.vue'
import TextInputStage from '@/modules/editor/components/TextInputStage.vue'
import TimelineEditStage from '@/modules/editor/components/TimelineEditStage.vue'

const audioStore = useAudioStore()
const projectStore = useProjectStore()
const appStore = useAppStore()

// 使用 storeToRefs 获取响应式数据
const { tracks, currentTrackId, hasTracks, currentTrack } = storeToRefs(audioStore)

// 响应式数据
const workflowStage = ref<'input' | 'timeline'>('input')
const selectedSegmentId = ref<string>('')
const selectedSegmentIndex = ref<number>(-1)
const playingSegmentId = ref<string>('')
const selectedGapId = ref<string>('')
const showSentenceVoiceEditor = ref<boolean>(false)
const selectedSegmentForVoice = ref<any>(null)

// 组件引用
const textInputStageRef = ref()

// Store解构
const {
  addTrack,
  removeTrack,
  setCurrentTrack,
  playTrack,
  clearTracks,
  segmentTrack,
  unsegmentTrack,
  updateSegmentText,
  removeSegment,
  addSegment,
  addGap,
  updateGapDuration,
  removeGap,
  selectGap,
  initializeGaps
} = audioStore

const {
  currentProject,
  saveProject: saveProjectToStore
} = projectStore

// 计算属性
const timelineSegments = computed(() => {
  const segments: any[] = []
  let currentTime = 0

  tracks.value.forEach(track => {
    if (track.isSegmented && track.segments) {
      track.segments.forEach((segment, index) => {
        const segmentDuration = (segment as any).duration || 3
        segments.push({
          ...segment,
          startTime: currentTime,
          endTime: currentTime + segmentDuration,
          duration: segmentDuration,
          isPlaying: track.isPlaying,
          audioUrl: track.audioUrl,
          voice: track.voice,
          speed: track.speed,
          pitch: track.pitch
        })
        currentTime += segmentDuration
      })
    } else {
      segments.push({
        id: track.id,
        text: track.text,
        startTime: currentTime,
        endTime: currentTime + (track.duration || 0),
        duration: track.duration || 0,
        isPlaying: track.isPlaying,
        audioUrl: track.audioUrl,
        voice: track.voice,
        speed: track.speed,
        pitch: track.pitch,
        startIndex: 0,
        endIndex: track.text.length,
        type: 'sentence'
      })
      currentTime += track.duration || 0
    }
  })

  return segments
})

const timelineGaps = computed(() => {
  const gaps: any[] = []
  let currentTime = 0

  tracks.value.forEach(track => {
    if (track.isSegmented && track.segments && track.gaps) {
      track.gaps.forEach((gap, index) => {
        const beforeSegment = track.segments?.find(s => s.id === gap.beforeSegmentId)
        const afterSegment = track.segments?.find(s => s.id === gap.afterSegmentId)

        if (beforeSegment && afterSegment) {
          const gapStartTime = currentTime + ((beforeSegment as any).duration || 3)

          gaps.push({
            ...gap,
            startTime: gapStartTime,
            endTime: gapStartTime + gap.duration
          })
        }
      })
    }
  })

  return gaps
})

const totalTimelineDuration = computed(() => {
  const duration = timelineSegments.value.reduce((total, segment) => total + segment.duration, 0)
  const gapDuration = timelineGaps.value.reduce((total, gap) => total + gap.duration, 0)
  return duration + gapDuration
})

// 事件处理方法
const handleStageChange = (stage: 'input' | 'timeline') => {
  workflowStage.value = stage
}

const saveProject = async () => {
  if (!currentProject) {
    ElMessage.warning('请先创建或选择项目')
    return
  }

  try {
    await saveProjectToStore(currentProject)
    ElMessage.success('项目保存成功')
  } catch (error) {
    console.error('保存项目失败:', error)
    ElMessage.error('保存项目失败')
  }
}

const exportProject = async () => {
  if (!currentProject) {
    ElMessage.warning('请先创建或选择项目')
    return
  }

  try {
    const data = await projectStore.exportProject(currentProject.id)
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('项目导出成功')
  } catch (error) {
    console.error('导出项目失败:', error)
    ElMessage.error('导出项目失败')
  }
}

const handleStartSegmentation = (text: string) => {
  // 文本已经在TextInputStage中处理，这里不需要额外操作
}

const handleSegmentationConfirm = (method: 'punctuation' | 'paragraph' | 'ai', text: string) => {
  performSegmentation(text, method)
}

const performSegmentation = (text: string, method: 'punctuation' | 'paragraph' | 'ai') => {
  try {
    const segments = TextSegmentation.segment(text, {
      method: method,
      minLength: 1,
      maxLength: 100,
      preserveWhitespace: true
    })

    if (segments.length === 0) {
      ElMessage.warning('分句结果为空，请检查文本内容')
      return
    }

    const segmentsWithDuration = segments.map((segment, index) => ({
      ...segment,
      duration: 3,
      voice: 'zhichu',  // 初始化语音设置
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      pauseMarks: [],  // 初始化停顿标记
      pronunciationMarks: []  // 初始化发音标记
    }))

    clearTracks()

    const trackId = addTrack({
      name: `分句文本_${Date.now()}`,
      text: text,
      voice: 'zhichu',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      audioUrl: undefined,
      duration: segmentsWithDuration.reduce((total, seg) => total + seg.duration, 0)
    })

    segmentTrack(trackId, segmentsWithDuration, method)

    // 确保在segmentTrack完成后立即初始化gaps
    if (segments.length > 1) {
      audioStore.initializeGaps(trackId)
    }

    ElMessage.success(`成功分句为 ${segments.length} 个句子`)
    workflowStage.value = 'timeline'

    if (segmentsWithDuration.length > 0) {
      const firstSegment = segmentsWithDuration[0]
      selectedSegmentId.value = firstSegment.id
      selectedSegmentIndex.value = 0
      handleOpenVoiceEditor(firstSegment)
    }

  } catch (error) {
    console.error('分句处理失败:', error)
    ElMessage.error('分句处理失败')
  }
}

// 时间轴相关事件处理
const handleSelectSegment = (segment: any) => {
  selectedSegmentId.value = segment.id
  selectedSegmentIndex.value = timelineSegments.value.findIndex(s => s.id === segment.id)

  // 自动打开语音编辑器
  handleOpenVoiceEditor(segment)
}

const handlePlaySegment = (segmentId: string) => {
  const segment = timelineSegments.value.find(s => s.id === segmentId)
  if (segment) {
    playingSegmentId.value = segmentId
    ElMessage.info(`播放分句: ${segment.text}`)
  }
}

const handleEditSegment = (segmentId: string) => {
  const segment = timelineSegments.value.find(s => s.id === segmentId)
  if (segment) {
    handleSelectSegment(segment)
  }
}

const handleAddText = (position: number) => {
  ElMessage.info(`在位置 ${position.toFixed(1)}s 添加文字功能开发中...`)
}

const handleUpdateSegmentText = (segmentId: string, newText: string) => {

  // 找到包含此segment的track
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    const segment = track.segments.find(s => s.id === segmentId)
    if (segment) {
      // 使用store方法来更新文本，确保响应式更新
      audioStore.updateSegmentText(track.id, segmentId, newText)

      // 如果当前编辑的是选中的语音编辑器中的句子，也要更新它
      if (selectedSegmentForVoice.value && selectedSegmentForVoice.value.id === segmentId) {
        selectedSegmentForVoice.value.text = newText
      }

      ElMessage.success('句子内容已更新')
    } else {
      console.error('Editor - segment not found:', segmentId)
    }
  } else {
    console.error('Editor - track or segments not found')
  }
}

const handleDeleteSegment = (segmentId: string) => {
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    const index = track.segments.findIndex(s => s.id === segmentId)
    if (index > -1) {
      track.segments.splice(index, 1)
      track.text = track.segments.map(seg => seg.text).join(' ')

      if (selectedSegmentId.value === segmentId) {
        selectedSegmentId.value = ''
        selectedSegmentIndex.value = -1
      }

      ElMessage.success('句子已删除')

      if (track.segments.length === 0) {
        workflowStage.value = 'input'
        ElMessage.info('所有句子已删除，返回文本输入阶段')
      }
    }
  }
}

const handleAddSentenceAfter = (segmentId: string, index: number) => {

  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    track.segments.forEach((seg, idx) => {
    })

    // 确认当前选中的segment的实际位置
    const actualIndex = track.segments.findIndex(seg => seg.id === segmentId)

    // 检查是否存在原来的间隔需要处理
    let originalGapToRemove = null
    if (actualIndex < track.segments.length - 1) {
      const nextSegment = track.segments[actualIndex + 1]
      if (nextSegment && track.gaps) {
        // 查找原来的间隔
        originalGapToRemove = track.gaps.find(gap =>
          gap.beforeSegmentId === segmentId && gap.afterSegmentId === nextSegment.id
        )
        if (originalGapToRemove) {
        }
      }
    }

    const newSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      startIndex: 0,
      endIndex: 0,
      type: 'sentence' as const,
      voice: 'zhichu',  // 初始化语音设置
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      pauseMarks: [],  // 初始化停顿标记
      pronunciationMarks: []  // 初始化发音标记
    }

    // 使用实际找到的索引位置，在其后面插入
    const insertIndex = actualIndex + 1

    track.segments.splice(insertIndex, 0, newSegment)

    track.segments.forEach((seg, idx) => {
    })

    // 处理间隔：
    // 1. 如果存在原来的间隔，先删除它
    if (originalGapToRemove && track.gaps) {
      const gapIndex = track.gaps.findIndex(g => g.id === originalGapToRemove.id)
      if (gapIndex > -1) {
        track.gaps.splice(gapIndex, 1)
      }
    }

    // 2. 创建新的间隔
    // 创建 "前一句 -> 新句子" 的间隔
    const prevSegment = track.segments[insertIndex - 1]
    if (prevSegment) {
      audioStore.addGap(track.id, prevSegment.id, newSegment.id, 1)
    }

    // 创建 "新句子 -> 后一句" 的间隔
    if (insertIndex < track.segments.length - 1) {
      const nextSegment = track.segments[insertIndex + 1]
      if (nextSegment) {
        audioStore.addGap(track.id, newSegment.id, nextSegment.id, 1)
      }
    }

    selectedSegmentId.value = newSegment.id

    // 打印最终的时间轴数据
    track.segments.forEach((seg, idx) => {
    })

    if (track.gaps) {
      track.gaps.forEach((gap, idx) => {
      })
    }

    const finalTimelineSegments = timelineSegments.value
    finalTimelineSegments.forEach((seg, idx) => {
    })

    ElMessage.success('新句子已添加，请编辑内容')
  } else {
    console.error('Track not found or no segments')
  }
}

const handleAddGap = (beforeSegmentId: string, afterSegmentId: string) => {

  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {

    // 检查是否已经存在间隔
    const existingGap = track.gaps?.find(gap => gap.beforeSegmentId === beforeSegmentId)
    if (existingGap) {
      ElMessage.warning('这两个句子之间已经存在间隔')
      return
    }

    // 创建新的间隔，默认1秒
    audioStore.addGap(track.id, beforeSegmentId, afterSegmentId, 1)
    ElMessage.success('已添加1秒间隔')
  } else {
    console.error('Track not found or no segments')
    ElMessage.error('添加间隔失败：未找到对应的轨道数据')
  }

}

// 间隔相关事件处理
const handleSelectGap = (gap: any) => {
  selectedGapId.value = gap.id
  selectedSegmentId.value = ''
  selectedSegmentIndex.value = -1
}

const handleUpdateGapDuration = (gapId: string, duration: number) => {

  const track = tracks.value.find(t => t.isSegmented && t.gaps)

  if (track && track.gaps) {
    const gap = track.gaps.find(g => g.id === gapId)

    if (gap) {
      audioStore.updateGapDuration(track.id, gapId, duration)
    } else {
      console.error('Gap not found with gapId:', gapId)
    }
  } else {
    console.error('Track not found or has no gaps')
  }

}

const handleRemoveGap = (gapId: string) => {

  const track = tracks.value.find(t => t.isSegmented && t.gaps)

  if (track && track.gaps) {

    // 调用store方法删除gap
    audioStore.removeGap(track.id, gapId)

    // 清理选中状态
    if (selectedGapId.value === gapId) {
      selectedGapId.value = ''
    }

    // 清理语音编辑器状态（如果当前正在编辑）
    if (showSentenceVoiceEditor.value) {
      showSentenceVoiceEditor.value = false
      selectedSegmentForVoice.value = null
    }

    ElMessage.success('间隔已删除')
  } else {
    console.error('Track not found or has no gaps')
    ElMessage.error('删除间隔失败：未找到对应的轨道数据')
  }

}

// 语音编辑相关事件处理

const handleOpenVoiceEditor = (segment: any) => {
  console.log('=== Editor - handleOpenVoiceEditor START ===')
  console.log('segment:', segment.id, segment.text)
  
  // 从store中获取已保存的语音设置
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  console.log('found track:', track?.id)
  
  if (track) {
    console.log('Editor - calling audioStore.getSegmentVoiceSettings with:', track.id, segment.id)
    
    const savedSettings = audioStore.getSegmentVoiceSettings(track.id, segment.id)
    console.log('Editor - savedSettings from store:', savedSettings)
    console.log('savedSettings type:', typeof savedSettings)
    console.log('savedSettings is null:', savedSettings === null)
    if (savedSettings) {
      console.log('savedSettings.pauseMarks:', savedSettings.pauseMarks)
      console.log('savedSettings.pronunciationMarks:', savedSettings.pronunciationMarks)
    }
    
    // 创建带有默认值的segment对象
    const createSegmentWithDefaults = (baseSegment: any, savedSettings?: any) => ({
      ...baseSegment,
      voice: savedSettings?.voice || baseSegment.voice || 'zhichu',
      speed: savedSettings?.speed ?? baseSegment.speed ?? 1,
      pitch: savedSettings?.pitch ?? baseSegment.pitch ?? 1,
      volume: savedSettings?.volume ?? baseSegment.volume ?? 1,
      ssml: savedSettings?.ssml || baseSegment.ssml || '',
      pauseMarks: savedSettings?.pauseMarks || baseSegment.pauseMarks || [],
      pronunciationMarks: savedSettings?.pronunciationMarks || baseSegment.pronunciationMarks || []
    })

    if (savedSettings) {
      console.log('Editor - 合并保存的设置到segment对象')
      selectedSegmentForVoice.value = createSegmentWithDefaults(segment, savedSettings)
    } else {
      console.log('Editor - 使用原始segment并添加默认值')
      selectedSegmentForVoice.value = createSegmentWithDefaults(segment)
    }
    
    console.log('Editor - 初始化后的selectedSegmentForVoice:', selectedSegmentForVoice.value)
    console.log('Editor - pauseMarks in selectedSegmentForVoice:', selectedSegmentForVoice.value.pauseMarks)
    console.log('Editor - pronunciationMarks in selectedSegmentForVoice:', selectedSegmentForVoice.value.pronunciationMarks)
  } else {
    console.log('Editor - 没有找到track')
    selectedSegmentForVoice.value = segment
  }
  showSentenceVoiceEditor.value = true
  console.log('=== Editor - handleOpenVoiceEditor END ===')
}

const closeSentenceVoiceEditor = () => {
  showSentenceVoiceEditor.value = false
  selectedSegmentForVoice.value = null
}

const handleSynthesizeAudio = (segment: any) => {
  ElMessage.info(`正在为句子"${segment.text}"合成音频...`)
}

const handlePlayAudio = (segment: any) => {
  if (segment.audioUrl) {
    const audio = new Audio(segment.audioUrl)
    audio.play().catch(error => {
      console.error('播放音频失败:', error)
      ElMessage.error('播放音频失败')
    })
  } else {
    ElMessage.warning('该句子还没有合成音频')
  }
}

// 统一的语音设置保存方法
const saveCurrentVoiceSettings = () => {
  if (!selectedSegmentForVoice.value) return
  
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (!track) return
  
  // 收集所有语音设置，使用默认值确保完整性
  const allSettings = {
    voice: selectedSegmentForVoice.value.voice || 'zhichu',
    speed: selectedSegmentForVoice.value.speed ?? 1,
    pitch: selectedSegmentForVoice.value.pitch ?? 1,
    volume: selectedSegmentForVoice.value.volume ?? 1,
    ssml: selectedSegmentForVoice.value.ssml || '',
    pauseMarks: selectedSegmentForVoice.value.pauseMarks || [],
    pronunciationMarks: selectedSegmentForVoice.value.pronunciationMarks || []
  }
  
  console.log('Editor - saving ALL voice settings to store:', allSettings)
  audioStore.updateSegmentVoiceSettings(track.id, selectedSegmentForVoice.value.id, allSettings)
}

const handleSSMLUpdate = (ssml: string) => {
  console.log('=== Editor - handleSSMLUpdate START ===')
  console.log('ssml received:', ssml)
  console.log('selectedSegmentForVoice:', selectedSegmentForVoice.value?.id)
  
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.ssml = ssml
    // 使用统一保存方法
    saveCurrentVoiceSettings()
  }
  console.log('=== Editor - handleSSMLUpdate END ===')
}

const handleVoiceUpdate = (voice: any) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.voice = voice.id
    saveCurrentVoiceSettings()
  }
}

const handleVolumeUpdate = (volume: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.volume = volume
    saveCurrentVoiceSettings()
  }
}

const handleSpeedUpdate = (speed: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.speed = speed
    saveCurrentVoiceSettings()
  }
}

const handlePitchUpdate = (pitch: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.pitch = pitch
    saveCurrentVoiceSettings()
  }
}

const handlePauseMarksUpdate = (pauseMarks: any[]) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.pauseMarks = pauseMarks
    saveCurrentVoiceSettings()
  }
}

const handlePronunciationMarksUpdate = (pronunciationMarks: any[]) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.pronunciationMarks = pronunciationMarks
    saveCurrentVoiceSettings()
  }
}

// 监控tracks变化
watch(tracks, (newTracks) => {

  if (newTracks.length > 0 && !selectedSegmentId.value && timelineSegments.value.length > 0) {
    const firstSegment = timelineSegments.value[0]
    if (firstSegment && firstSegment.id) {
      selectedSegmentId.value = firstSegment.id
      selectedSegmentIndex.value = 0
      handleOpenVoiceEditor(firstSegment)
    }
  }

  // 检查新tracks是否需要初始化gaps
  newTracks.forEach((track, index) => {
    if (track.isSegmented && track.segments && track.segments.length > 1) {

      if (!track.gaps || track.gaps.length === 0) {
        audioStore.initializeGaps(track.id)
      } else {
        // 检查现有gaps是否有NaN值
        let hasNaN = false
        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            gap.duration = 1
            hasNaN = true
          }
        })
        if (hasNaN) {
        }
      }
    }
  })

}, { immediate: true, deep: true })

// 生命周期
onMounted(() => {
  appStore.init()

  // AudioStore 测试功能
  console.log('🔧 AudioStore 测试开始...')

  // 暴露AudioStore到全局window对象供测试使用
  ;(window as any).audioStore = audioStore
  ;(window as any).testVoiceSettingsFlow = () => {
    console.log('🧪 开始语音设置流程测试...')

    // 测试完整的语音设置保存和恢复流程
    if (tracks.value.length > 0) {
      const track = tracks.value[0]
      console.log('📦 使用track:', track.id)

      if (track.isSegmented && track.segments && track.segments.length >= 2) {
        console.log('🎯 测试两个segment之间的设置保存和恢复...')

        // 获取前两个segment
        const segment1 = track.segments[0]
        const segment2 = track.segments[1]

        console.log('📝 Segment 1:', segment1.id, segment1.text)
        console.log('📝 Segment 2:', segment2.id, segment2.text)

        // 1. 为segment1设置特定的语音参数
        const settings1 = {
          voice: 'caocao',
          speed: 1.5,
          volume: 0.8,
          pitch: 1.2,
          pauseMarks: [{ charIndex: 2, duration: 1.5 }],
           pronunciationMarks: [{ charIndex: 4, pinyin: 'test1' }]
        }

        console.log('💾 为segment1保存设置:', settings1)
        audioStore.updateSegmentVoiceSettings(track.id, segment1.id, settings1)

        // 2. 验证设置是否保存成功
        const retrieved1 = audioStore.getSegmentVoiceSettings(track.id, segment1.id)
        console.log('🔍 从store获取segment1设置:', retrieved1)

        // 3. 为segment2设置不同的语音参数
        const settings2 = {
          voice: 'zhichu',
          speed: 0.8,
          volume: 1.2,
          pitch: 0.9,
          pauseMarks: [{ charIndex: 1, duration: 2.0 }],
           pronunciationMarks: [{ charIndex: 3, pinyin: 'test2' }]
        }

        console.log('💾 为segment2保存设置:', settings2)
        audioStore.updateSegmentVoiceSettings(track.id, segment2.id, settings2)

        // 4. 验证segment2设置是否保存成功
        const retrieved2 = audioStore.getSegmentVoiceSettings(track.id, segment2.id)
        console.log('🔍 从store获取segment2设置:', retrieved2)

        // 5. 再次获取segment1的设置，确认没有被覆盖
        const retrieved1Again = audioStore.getSegmentVoiceSettings(track.id, segment1.id)
        console.log('🔍 再次从store获取segment1设置:', retrieved1Again)

         // 6. 比较设置是否正确保持
         const segment1Match = retrieved1Again ? JSON.stringify(settings1) === JSON.stringify({
           voice: retrieved1Again.voice,
           speed: retrieved1Again.speed,
           volume: retrieved1Again.volume,
           pitch: retrieved1Again.pitch,
           pauseMarks: retrieved1Again.pauseMarks,
           pronunciationMarks: retrieved1Again.pronunciationMarks
         }) : false

         const segment2Match = retrieved2 ? JSON.stringify(settings2) === JSON.stringify({
           voice: retrieved2.voice,
           speed: retrieved2.speed,
           volume: retrieved2.volume,
           pitch: retrieved2.pitch,
           pauseMarks: retrieved2.pauseMarks,
           pronunciationMarks: retrieved2.pronunciationMarks
         }) : false

        console.log(`📊 Segment1设置保持: ${segment1Match ? '✅' : '❌'}`)
        console.log(`📊 Segment2设置保持: ${segment2Match ? '✅' : '❌'}`)

        return {
          success: segment1Match && segment2Match,
          segment1: { saved: settings1, retrieved: retrieved1Again },
          segment2: { saved: settings2, retrieved: retrieved2 }
        }
      } else {
        console.log('⚠️ 需要至少2个分段来测试切换')
        return { success: false, reason: '需要至少2个分段' }
      }
    } else {
      console.log('⚠️ 没有track数据')
      return { success: false, reason: '没有track数据' }
    }
  }

  ;(window as any).testAudioStore = () => {
    console.log('🧪 开始AudioStore功能测试...')

    // 测试1: 检查store方法是否存在
    const methods = [
      'getSegmentVoiceSettings',
      'updateSegmentVoiceSettings',
      'addTrack',
      'updateTrack'
    ]

    methods.forEach(method => {
      const exists = typeof audioStore[method] === 'function'
      console.log(`📋 ${method}: ${exists ? '✅ 存在' : '❌ 不存在'}`)
    })

    // 测试2: 如果有tracks，测试语音设置功能
    if (tracks.value.length > 0) {
      const track = tracks.value[0]
      console.log('📦 当前tracks数量:', tracks.value.length)
      console.log('📊 第一个track状态:', {
        id: track.id,
        isSegmented: track.isSegmented,
        segmentsCount: track.segments?.length || 0
      })

      if (track.isSegmented && track.segments && track.segments.length > 0) {
        const segment = track.segments[0]
        console.log('🎯 测试第一个segment的语音设置...')

        // 尝试获取语音设置
        const currentSettings = audioStore.getSegmentVoiceSettings(track.id, segment.id)
        console.log('📤 获取到的设置:', currentSettings)

        // 尝试更新语音设置
        const testSettings = {
          voice: 'test-voice',
          speed: 1.5,
          volume: 0.8,
          pitch: 1.2,
          pauseMarks: [{ charIndex: 5, duration: 1.0 }],
           pronunciationMarks: [{ charIndex: 3, pinyin: 'test' }]
        }

        console.log('📥 尝试保存设置:', testSettings)
        audioStore.updateSegmentVoiceSettings(track.id, segment.id, testSettings)

        // 验证设置是否保存成功
        const updatedSettings = audioStore.getSegmentVoiceSettings(track.id, segment.id)
        console.log('🔍 验证保存结果:', updatedSettings)

        // 比较设置是否一致 - 只比较我们设置的字段
        const fieldsToCheck = ['voice', 'speed', 'volume', 'pitch', 'pauseMarks', 'pronunciationMarks']
        let settingsMatch = true
        let mismatchDetails = []

        for (const field of fieldsToCheck) {
          const testValue = JSON.stringify(testSettings[field])
          const updatedValue = JSON.stringify(updatedSettings[field])

          if (testValue !== updatedValue) {
            settingsMatch = false
            mismatchDetails.push(`${field}: 期望 ${testValue}, 实际 ${updatedValue}`)
          }
        }

        if (settingsMatch) {
          console.log('📊 设置保存✅ 成功')
        } else {
          console.log('📊 设置保存❌ 失败')
          console.log('❌ 不匹配的字段:', mismatchDetails)
        }

        return {
          success: settingsMatch,
          originalSettings: currentSettings,
          testSettings,
          updatedSettings
        }
      } else {
        console.log('⚠️ 没有分段数据可供测试')
        return { success: false, reason: '没有分段数据' }
      }
    } else {
      console.log('⚠️ 没有track数据可供测试')
      return { success: false, reason: '没有track数据' }
    }
  }

   ;(window as any).debugMarks = (trackId: string, segmentId: string) => {
    console.log('🔍 开始调试标记数据...')
    console.log('参数:', { trackId, segmentId })

    // 1. 直接从store检查
    const storeData = audioStore.getSegmentVoiceSettings(trackId, segmentId)
    console.log('📦 Store中的完整数据:', storeData)
    console.log('📦 Store中的pauseMarks:', storeData?.pauseMarks)
    console.log('📦 Store中的pronunciationMarks:', storeData?.pronunciationMarks)
    console.log('📦 pauseMarks类型:', typeof storeData?.pauseMarks)
    console.log('📦 pronunciationMarks类型:', typeof storeData?.pronunciationMarks)
    console.log('📦 pauseMarks是否为数组:', Array.isArray(storeData?.pauseMarks))
    console.log('📦 pronunciationMarks是否为数组:', Array.isArray(storeData?.pronunciationMarks))

    // 2. 检查tracks中的原始数据
    const track = tracks.value.find(t => t.id === trackId)
    const segment = track?.segments?.find(s => s.id === segmentId)
    console.log('📊 Segment原始数据:', segment)
    console.log('📊 Segment中的pauseMarks:', segment?.pauseMarks)
    console.log('📊 Segment中的pronunciationMarks:', segment?.pronunciationMarks)

    // 3. 模拟handleOpenVoiceEditor的逻辑
    if (track && segment && storeData) {
      const testSelectedSegment = {
        ...segment,
        voice: storeData.voice || segment.voice,
        speed: storeData.speed || segment.speed,
        pitch: storeData.pitch || segment.pitch,
        volume: storeData.volume || segment.volume,
        ssml: storeData.ssml || segment.ssml,
        pauseMarks: storeData.pauseMarks || [],
        pronunciationMarks: storeData.pronunciationMarks || []
      }
      console.log('🧪 模拟合并结果:', testSelectedSegment)
      console.log('🧪 模拟合并后pauseMarks:', testSelectedSegment.pauseMarks)
      console.log('🧪 模拟合并后pronunciationMarks:', testSelectedSegment.pronunciationMarks)
    }

    return {
      storeData,
      segmentData: segment,
      trackFound: !!track,
      segmentFound: !!segment
    }
  }

  console.log('🎉 AudioStore已暴露到window对象')
  console.log('📚 可以在控制台运行测试:')
  console.log('  - window.testAudioStore() - 基础功能测试')
  console.log('  - window.testVoiceSettingsFlow() - 语音设置切换测试')
  console.log('  - window.debugMarks(trackId, segmentId) - 调试标记数据丢失问题')

  // 检查现有的分句数据并初始化gaps
  tracks.value.forEach((track, index) => {

    if (track.isSegmented && track.segments && track.segments.length > 1) {
      if (!track.gaps || track.gaps.length === 0) {
        audioStore.initializeGaps(track.id)
      } else {
        // 检查现有gaps是否有NaN值
        let hasNaN = false
        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            gap.duration = 1
            hasNaN = true
          }
        })
        if (hasNaN) {
        }
      }
    }
  })

})
</script>

<style scoped>
.editor {
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
}

.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-sidebar {
    width: 60px !important;
  }

  .sidebar-content {
    display: none;
  }
}
</style>