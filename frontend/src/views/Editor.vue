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
        @close-voice-editor="closeSentenceVoiceEditor"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
        const beforeSegment = track.segments.find(s => s.id === gap.beforeSegmentId)
        const afterSegment = track.segments.find(s => s.id === gap.afterSegmentId)

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
  console.log('Editor - handleStartSegmentation called with text:', text)
  // 文本已经在TextInputStage中处理，这里不需要额外操作
}

const handleSegmentationConfirm = (method: 'punctuation' | 'paragraph' | 'ai', text: string) => {
  console.log('Editor - handleSegmentationConfirm called with method:', method, 'text:', text)
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
      duration: 3
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
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    const segment = track.segments.find(s => s.id === segmentId)
    if (segment) {
      segment.text = newText
      track.text = track.segments.map(seg => seg.text).join(' ')
      ElMessage.success('句子内容已更新')
    }
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
    const newSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      startIndex: 0,
      endIndex: 0,
      type: 'sentence' as const
    }

    const insertIndex = index + 1
    track.segments.splice(insertIndex, 0, newSegment)

    audioStore.initializeGaps(track.id)
    selectedSegmentId.value = newSegment.id

    ElMessage.success('新句子已添加，请编辑内容')
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
      ElMessage.success('间隔时长已更新')
    }
  }
}

const handleRemoveGap = (gapId: string) => {
  const track = tracks.value.find(t => t.isSegmented && t.gaps)
  if (track && track.gaps) {
    audioStore.removeGap(track.id, gapId)
    if (selectedGapId.value === gapId) {
      selectedGapId.value = ''
    }
    ElMessage.success('间隔已删除')
  }
}

// 语音编辑相关事件处理
const handleOpenVoiceEditor = (segment: any) => {
  selectedSegmentForVoice.value = segment
  showSentenceVoiceEditor.value = true
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

const handleSSMLUpdate = (ssml: string) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.ssml = ssml
  }
}

const handleVoiceUpdate = (voice: any) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.voice = voice.id
  }
}

const handleVolumeUpdate = (volume: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.volume = volume
  }
}

const handleSpeedUpdate = (speed: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.speed = speed
  }
}

const handlePitchUpdate = (pitch: number) => {
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.pitch = pitch
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
}, { immediate: true, deep: true })

// 生命周期
onMounted(() => {
  appStore.init()
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