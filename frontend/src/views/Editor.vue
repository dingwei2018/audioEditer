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

    // 确保在segmentTrack完成后立即初始化gaps
    if (segments.length > 1) {
      console.log('Editor - performSegmentation: About to initialize gaps for trackId:', trackId)
      console.log('Editor - performSegmentation: segments count:', segments.length)
      audioStore.initializeGaps(trackId)
      console.log('Editor - performSegmentation: gaps initialization completed')
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
  console.log('Editor - handleUpdateSegmentText:', segmentId, newText)

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
      console.log('Editor - segment text updated via store:', newText)
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
  console.log('=== Editor - handleAddSentenceAfter START ===')
  console.log('segmentId:', segmentId)
  console.log('index passed from UI:', index)

  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    console.log('Track found with segments:', track.segments.length)
    console.log('BEFORE INSERTION - Current segments order:')
    track.segments.forEach((seg, idx) => {
      console.log(`  ${idx}: ${seg.id} - "${seg.text}"`)
    })

    // 确认当前选中的segment的实际位置
    const actualIndex = track.segments.findIndex(seg => seg.id === segmentId)
    console.log('Actual index of selected segment in track.segments:', actualIndex)

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
          console.log('Found original gap to replace:', originalGapToRemove.id)
        }
      }
    }

    const newSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      startIndex: 0,
      endIndex: 0,
      type: 'sentence' as const
    }

    // 使用实际找到的索引位置，在其后面插入
    const insertIndex = actualIndex + 1
    console.log('Will insert new segment at index:', insertIndex)
    console.log('This means after segment at actual index:', actualIndex, 'which is:', track.segments[actualIndex]?.id)

    track.segments.splice(insertIndex, 0, newSegment)

    console.log('AFTER INSERTION - New segments order:')
    track.segments.forEach((seg, idx) => {
      console.log(`  ${idx}: ${seg.id} - "${seg.text}"`)
    })

    // 处理间隔：
    // 1. 如果存在原来的间隔，先删除它
    if (originalGapToRemove && track.gaps) {
      const gapIndex = track.gaps.findIndex(g => g.id === originalGapToRemove.id)
      if (gapIndex > -1) {
        track.gaps.splice(gapIndex, 1)
        console.log('Removed original gap:', originalGapToRemove.id)
      }
    }

    // 2. 创建新的间隔
    // 创建 "前一句 -> 新句子" 的间隔
    const prevSegment = track.segments[insertIndex - 1]
    if (prevSegment) {
      console.log('Creating gap: prev -> new:', prevSegment.id, '->', newSegment.id)
      audioStore.addGap(track.id, prevSegment.id, newSegment.id, 1)
    }

    // 创建 "新句子 -> 后一句" 的间隔
    if (insertIndex < track.segments.length - 1) {
      const nextSegment = track.segments[insertIndex + 1]
      if (nextSegment) {
        console.log('Creating gap: new -> next:', newSegment.id, '->', nextSegment.id)
        audioStore.addGap(track.id, newSegment.id, nextSegment.id, 1)
      }
    }

    selectedSegmentId.value = newSegment.id

    // 打印最终的时间轴数据
    console.log('=== FINAL DATA CHECK ===')
    console.log('Final track.segments:')
    track.segments.forEach((seg, idx) => {
      console.log(`  segments[${idx}]: ${seg.id} - "${seg.text}"`)
    })

    console.log('Final track.gaps:')
    if (track.gaps) {
      track.gaps.forEach((gap, idx) => {
        console.log(`  gaps[${idx}]: ${gap.beforeSegmentId} -> ${gap.afterSegmentId} (${gap.duration}s)`)
      })
    }

    console.log('Final timelineSegments computed:')
    const finalTimelineSegments = timelineSegments.value
    finalTimelineSegments.forEach((seg, idx) => {
      console.log(`  timelineSegments[${idx}]: ${seg.id} - "${seg.text}"`)
    })

    console.log('=== Editor - handleAddSentenceAfter END ===')
    ElMessage.success('新句子已添加，请编辑内容')
  } else {
    console.error('Track not found or no segments')
  }
}

// 间隔相关事件处理
const handleSelectGap = (gap: any) => {
  selectedGapId.value = gap.id
  selectedSegmentId.value = ''
  selectedSegmentIndex.value = -1
}

const handleUpdateGapDuration = (gapId: string, duration: number) => {
  console.log('=== Editor - handleUpdateGapDuration START ===')
  console.log('Received gapId:', gapId)
  console.log('Received duration:', duration)
  console.log('Duration type:', typeof duration)
  console.log('Duration is NaN?', isNaN(duration))

  const track = tracks.value.find(t => t.isSegmented && t.gaps)
  console.log('Found track for gap update:', track ? track.id : 'NOT FOUND')

  if (track && track.gaps) {
    const gap = track.gaps.find(g => g.id === gapId)
    console.log('Found gap in track:', gap ? gap : 'NOT FOUND')

    if (gap) {
      console.log('Gap current duration before update:', gap.duration, 'type:', typeof gap.duration)
      audioStore.updateGapDuration(track.id, gapId, duration)
      ElMessage.success('间隔时长已更新')
    } else {
      console.error('Gap not found with gapId:', gapId)
    }
  } else {
    console.error('Track not found or has no gaps')
  }

  console.log('=== Editor - handleUpdateGapDuration END ===')
}

const handleRemoveGap = (gapId: string) => {
  console.log('=== Editor - handleRemoveGap START ===')
  console.log('gapId to remove:', gapId)

  const track = tracks.value.find(t => t.isSegmented && t.gaps)
  console.log('Found track for gap removal:', track ? track.id : 'NOT FOUND')

  if (track && track.gaps) {
    console.log('Track has gaps before removal:', track.gaps.length)

    // 调用store方法删除gap
    audioStore.removeGap(track.id, gapId)

    // 清理选中状态
    if (selectedGapId.value === gapId) {
      console.log('Clearing selected gap as it was removed')
      selectedGapId.value = ''
    }

    // 清理语音编辑器状态（如果当前正在编辑）
    if (showSentenceVoiceEditor.value) {
      console.log('Closing voice editor after gap removal')
      showSentenceVoiceEditor.value = false
      selectedSegmentForVoice.value = null
    }

    console.log('Gap removal completed successfully')
    ElMessage.success('间隔已删除')
  } else {
    console.error('Track not found or has no gaps')
    ElMessage.error('删除间隔失败：未找到对应的轨道数据')
  }

  console.log('=== Editor - handleRemoveGap END ===')
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
  console.log('=== Editor - tracks watch triggered ===')
  console.log('newTracks count:', newTracks.length)

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
      console.log(`Editor - watch: checking track ${index} (${track.id}) for gaps...`)

      if (!track.gaps || track.gaps.length === 0) {
        console.log(`Editor - watch: initializing gaps for track ${track.id}...`)
        audioStore.initializeGaps(track.id)
      } else {
        // 检查现有gaps是否有NaN值
        let hasNaN = false
        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            console.log(`  WARNING: Found NaN in gap ${gapIndex} during watch, fixing...`)
            gap.duration = 1
            hasNaN = true
          }
        })
        if (hasNaN) {
          console.log(`Editor - watch: fixed NaN values in track ${track.id} gaps`)
        }
      }
    }
  })

  console.log('=== Editor - tracks watch completed ===')
}, { immediate: true, deep: true })

// 生命周期
onMounted(() => {
  console.log('=== Editor - onMounted START ===')
  appStore.init()

  // 检查现有的分句数据并初始化gaps
  console.log('Editor - checking existing tracks for gap initialization...')
  tracks.value.forEach((track, index) => {
    console.log(`Editor - checking track ${index} (${track.id}):`)
    console.log(`  isSegmented: ${track.isSegmented}`)
    console.log(`  segments count: ${track.segments?.length || 0}`)
    console.log(`  gaps count: ${track.gaps?.length || 0}`)

    if (track.isSegmented && track.segments && track.segments.length > 1) {
      if (!track.gaps || track.gaps.length === 0) {
        console.log(`Editor - initializing gaps for track ${track.id}...`)
        audioStore.initializeGaps(track.id)
      } else {
        console.log(`Editor - track ${track.id} already has gaps, checking for NaN values...`)
        // 检查现有gaps是否有NaN值
        let hasNaN = false
        track.gaps.forEach((gap, gapIndex) => {
          if (isNaN(gap.duration)) {
            console.log(`  WARNING: Found NaN in gap ${gapIndex}, fixing...`)
            gap.duration = 1
            hasNaN = true
          }
        })
        if (hasNaN) {
          console.log(`Editor - fixed NaN values in track ${track.id} gaps`)
        }
      }
    }
  })

  console.log('=== Editor - onMounted END ===')
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