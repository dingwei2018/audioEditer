<template>
  <div class="editor">
    <div class="editor-container">
      <!-- 顶部导航工具栏 -->
      <div class="top-toolbar">
        <div class="toolbar-left">
          <h2 class="app-title">音频编辑器</h2>
        </div>
        <div class="toolbar-center">
          <el-button-group>
            <el-button 
              :type="workflowStage === 'input' ? 'primary' : 'default'"
              @click="workflowStage = 'input'"
              icon="Edit"
            >
              文本输入
            </el-button>
            <el-button 
              :type="workflowStage === 'timeline' ? 'primary' : 'default'"
              @click="workflowStage = 'timeline'"
              icon="Grid"
              :disabled="!hasTracks"
            >
              分句视图
            </el-button>
          </el-button-group>
        </div>
        <div class="toolbar-right">
          
          
          <el-button @click="saveProject">
            <el-icon><Document /></el-icon>
            保存
          </el-button>
          <el-button type="primary" @click="exportProject">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>

      <!-- 文本输入阶段 -->
      <div v-if="workflowStage === 'input'" class="text-input-stage">
        <TextInputArea @start-segmentation="handleStartSegmentation" />
      </div>

      <!-- 主编辑区域 - 仅在分句视图时显示 -->
      <div v-else-if="workflowStage === 'timeline'" class="main-editor">
        <div class="timeline-container">
          <!-- 分句时间轴视图 -->
          <div class="segments-timeline-view">
            <TimelineSegments
              :segments="timelineSegments"
              :gaps="timelineGaps"
              :total-duration="totalTimelineDuration"
              :selected-segment-id="selectedSegmentId"
              :playing-segment-id="playingSegmentId"
              :selected-gap-id="selectedGapId"
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
            />
          </div>
        </div>
        
        <!-- 句子语音编辑组件 -->
        <div v-if="showSentenceVoiceEditor" class="voice-editor-container">
          <SentenceVoiceEditor
            :sentence-text="selectedSegmentForVoice?.text || ''"
            :sentence-index="selectedSegmentIndex"
            :sentence-duration="selectedSegmentForVoice?.duration || 0"
            :initial-voice="getCurrentVoice(selectedSegmentForVoice?.voice)"
            :initial-volume="getTrackVolume(selectedSegmentForVoice)"
            :initial-speed="selectedSegmentForVoice?.speed || 1"
            :initial-pitch="selectedSegmentForVoice?.pitch || 1"
            @update-ssml="handleSSMLUpdate"
            @update-voice="handleVoiceUpdate"
            @update-volume="handleVolumeUpdate"
            @update-speed="handleSpeedUpdate"
            @update-pitch="handlePitchUpdate"
            @close="closeSentenceVoiceEditor"
          />
        </div>
      </div>
      
      <!-- 分句方式选择对话框 - 全局可用 -->
      <SegmentationDialog
        v-model="showSegmentationDialog"
        @confirm="handleSegmentationConfirm"
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
import SegmentEditor from '../components/SegmentEditor.vue'
import TimelineSegments from '../components/TimelineSegments.vue'
import SegmentEditPanel from '../components/SegmentEditPanel.vue'
import TextInputArea from '../components/TextInputArea.vue'
import SegmentationDialog from '../components/SegmentationDialog.vue'
import SentenceVoiceEditor from '../components/SentenceVoiceEditor.vue'

const audioStore = useAudioStore()
const projectStore = useProjectStore()
const appStore = useAppStore()

// 使用 storeToRefs 获取响应式数据
const { tracks, currentTrackId, hasTracks, currentTrack } = storeToRefs(audioStore)

// 响应式数据
const showSegmentEditor = ref(false)
const editingTrack = ref<any>(null)

// 工作流程相关数据
const workflowStage = ref<'input' | 'timeline' | 'tracks'>('input')
const showSegmentationDialog = ref(false)
const pendingText = ref('')

// 分句时间轴相关数据
const showSegmentsTimeline = ref(false)
const showSegmentEditPanel = ref(false)
const selectedSegment = ref<any>(null)
const selectedSegmentId = ref<string>('')
const selectedSegmentIndex = ref<number>(-1)
const playingSegmentId = ref<string>('')

// 间隔相关数据
const selectedGapId = ref<string>('')
const selectedGap = ref<any>(null)

// 句子语音编辑相关数据
const showSentenceVoiceEditor = ref<boolean>(false)
const selectedSegmentForVoice = ref<any>(null)

// 计算属性
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


// 时间轴分句数据计算属性
const timelineSegments = computed(() => {
  const segments: any[] = []
  let currentTime = 0
  
  console.log('Editor - timelineSegments computed, tracks:', tracks.value.length)
  tracks.value.forEach(track => {
    console.log('Editor - processing track:', track.id, 'isSegmented:', track.isSegmented, 'segments:', track.segments?.length)
    if (track.isSegmented && track.segments) {
      // 分句轨道：每个分句单独计算时间
      track.segments.forEach((segment, index) => {
        const segmentDuration = (segment as any).duration || 3 // 从segment中获取duration，如果没有则默认为3秒
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
      // 非分句轨道也显示在时间轴上
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
  
  console.log('Editor - timelineSegments result:', segments.length, 'segments')
  return segments
})

// 时间轴间隔数据计算属性
const timelineGaps = computed(() => {
  const gaps: any[] = []
  let currentTime = 0
  
  console.log('Editor - timelineGaps computed, tracks:', tracks.value.length)
  tracks.value.forEach(track => {
    console.log('Editor - processing track for gaps:', track.id, 'isSegmented:', track.isSegmented, 'gaps:', track.gaps?.length)
    if (track.isSegmented && track.segments && track.gaps) {
      // 为每个间隔计算时间位置
      track.gaps.forEach((gap, index) => {
        // 找到间隔前后的分句
        const beforeSegment = track.segments.find(s => s.id === gap.beforeSegmentId)
        const afterSegment = track.segments.find(s => s.id === gap.afterSegmentId)
        
        if (beforeSegment && afterSegment) {
          // 计算间隔的开始时间（前一个分句结束后）
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
  
  console.log('Editor - timelineGaps result:', gaps.length, 'gaps')
  return gaps
})

const totalTimelineDuration = computed(() => {
  const duration = timelineSegments.value.reduce((total, segment) => total + segment.duration, 0)
  const gapDuration = timelineGaps.value.reduce((total, gap) => total + gap.duration, 0)
  const total = duration + gapDuration
  console.log('Editor - totalTimelineDuration:', total, 'segments:', timelineSegments.value, 'gaps:', timelineGaps.value)
  return total
})

// 方法

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
    // 创建下载链接
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


const handleSegmentSave = (trackId: string, segments: any[]) => {
  // 更新轨道的分句信息
  segmentTrack(trackId, segments, editingTrack.value?.segmentMethod || 'punctuation')
  ElMessage.success('分句编辑已保存')
}

// 时间轴分句相关方法
const handleSelectSegment = (segment: any) => {
  selectedSegment.value = segment
  selectedSegmentId.value = segment.id
  selectedSegmentIndex.value = timelineSegments.value.findIndex(s => s.id === segment.id)
  showSegmentEditPanel.value = true
}

const handlePlaySegment = (segmentId: string) => {
  const segment = timelineSegments.value.find(s => s.id === segmentId)
  if (segment) {
    playingSegmentId.value = segmentId
    // 这里可以添加播放逻辑
    ElMessage.info(`播放分句: ${segment.text}`)
  }
}

const handleEditSegment = (segmentId: string) => {
  const segment = timelineSegments.value.find(s => s.id === segmentId)
  if (segment) {
    handleSelectSegment(segment)
  }
}

const closeSegmentEditPanel = () => {
  showSegmentEditPanel.value = false
  selectedSegment.value = null
  selectedSegmentId.value = ''
  selectedSegmentIndex.value = -1
}

const handleSegmentEditSave = (segment: any) => {
  // 更新分句数据
  const index = timelineSegments.value.findIndex(s => s.id === segment.id)
  if (index > -1) {
    Object.assign(timelineSegments.value[index], segment)
  }
  ElMessage.success('分句更改已保存')
}

const handleSegmentRegenerate = (segmentId: string, settings: any) => {
  // 重新生成分句语音
  ElMessage.info('重新生成分句语音...')
}

const handleAddText = (position: number) => {
  // 在指定位置添加新文字
  ElMessage.info(`在位置 ${position.toFixed(1)}s 添加文字功能开发中...`)
}

const handleUpdateSegmentText = (segmentId: string, newText: string) => {
  // 更新分句文本内容
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    const segment = track.segments.find(s => s.id === segmentId)
    if (segment) {
      segment.text = newText
      // 重新计算整个轨道的文本
      track.text = track.segments.map(seg => seg.text).join(' ')
      ElMessage.success('句子内容已更新')
    }
  }
}

const handleDeleteSegment = (segmentId: string) => {
  // 删除分句
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    const index = track.segments.findIndex(s => s.id === segmentId)
    if (index > -1) {
      track.segments.splice(index, 1)
      // 重新计算整个轨道的文本
      track.text = track.segments.map(seg => seg.text).join(' ')
      
      // 如果删除的是当前选中的分句，清除选中状态
      if (selectedSegmentId.value === segmentId) {
        selectedSegmentId.value = ''
        selectedSegment.value = null
        selectedSegmentIndex.value = -1
      }
      
      ElMessage.success('句子已删除')
      
      // 如果没有分句了，切换到输入阶段
      if (track.segments.length === 0) {
        workflowStage.value = 'input'
        ElMessage.info('所有句子已删除，返回文本输入阶段')
      }
    }
  }
}

// 间隔相关事件处理方法
const handleSelectGap = (gap: any) => {
  selectedGapId.value = gap.id
  selectedGap.value = gap
  // 清除句子选中状态
  selectedSegmentId.value = ''
  selectedSegment.value = null
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
    // 清除选中状态
    if (selectedGapId.value === gapId) {
      selectedGapId.value = ''
      selectedGap.value = null
    }
    ElMessage.success('间隔已删除')
  }
}

const handleAddSentenceAfter = (segmentId: string, index: number) => {
  const track = tracks.value.find(t => t.isSegmented && t.segments)
  if (track && track.segments) {
    // 创建新句子（空内容，等待用户输入）
    const newSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '', // 空内容，进入编辑模式
      startIndex: 0,
      endIndex: 0,
      type: 'sentence' as const
    }
    
    // 在指定位置后插入新句子
    const insertIndex = index + 1
    track.segments.splice(insertIndex, 0, newSegment)
    
    // 重新初始化间隔
    audioStore.initializeGaps(track.id)
    
    // 选中新添加的句子，让它进入编辑模式
    selectedSegmentId.value = newSegment.id
    
    ElMessage.success('新句子已添加，请编辑内容')
  }
}

// 语音编辑相关方法
const handleOpenVoiceEditor = (segment: any) => {
  selectedSegmentForVoice.value = segment
  showSentenceVoiceEditor.value = true
}

const closeSentenceVoiceEditor = () => {
  showSentenceVoiceEditor.value = false
  selectedSegmentForVoice.value = null
}

const getCurrentVoice = (voiceId?: string) => {
  // 根据voiceId返回对应的音色对象
  const voiceMap: Record<string, any> = {
    'zhichu': {
      id: 'zhichu',
      name: '知初',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/50E3C2/FFFFFF?text=知',
      description: '清新自然，适合日常对话',
      ssmlName: 'zh-CN-XiaoxiaoNeural'
    },
    'zhimei': {
      id: 'zhimei',
      name: '知美',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/BD10E0/FFFFFF?text=美',
      description: '温柔甜美，适合情感表达',
      ssmlName: 'zh-CN-XiaohanNeural'
    },
    'zhiwen': {
      id: 'zhiwen',
      name: '知文',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/B8E986/FFFFFF?text=文',
      description: '文雅知性，适合知识讲解',
      ssmlName: 'zh-CN-YunxiNeural'
    }
  }
  
  return voiceMap[voiceId || 'zhichu'] || voiceMap['zhichu']
}

const getTrackVolume = (segment: any) => {
  // 从轨道数据中获取音量，如果没有则返回默认值1
  if (tracks) {
    const track = tracks.value.find(t => t.id === segment?.id || (t.segments && t.segments.some((s: any) => s.id === segment?.id)))
    return track?.volume || 1
  }
  return 1
}

// 合成音频
const handleSynthesizeAudio = (segment: any) => {
  console.log('Editor - 合成音频:', segment)
  ElMessage.info(`正在为句子"${segment.text}"合成音频...`)
  // TODO: 实现音频合成逻辑
  // 这里可以调用音频合成API
}

// 播放音频
const handlePlayAudio = (segment: any) => {
  console.log('Editor - 播放音频:', segment)
  if (segment.audioUrl) {
    // 创建音频对象并播放
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
  // 处理SSML更新
  console.log('SSML更新:', ssml)
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.ssml = ssml
  }
}

const handleVoiceUpdate = (voice: any) => {
  // 处理音色更新
  console.log('音色更新:', voice)
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.voice = voice.id
  }
}

const handleVolumeUpdate = (volume: number) => {
  // 处理音量更新
  console.log('音量更新:', volume)
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.volume = volume
  }
}

const handleSpeedUpdate = (speed: number) => {
  // 处理语速更新
  console.log('语速更新:', speed)
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.speed = speed
  }
}

const handlePitchUpdate = (pitch: number) => {
  // 处理音调更新
  console.log('音调更新:', pitch)
  if (selectedSegmentForVoice.value) {
    selectedSegmentForVoice.value.pitch = pitch
  }
}

// 工作流程相关方法
const handleStartSegmentation = (text: string) => {
  console.log('Editor - handleStartSegmentation called')
  console.log('Editor - received text:', text)
  console.log('Editor - text length:', text.length)
  console.log('Editor - text type:', typeof text)
  pendingText.value = text
  console.log('Editor - pendingText.value set to:', pendingText.value)
  showSegmentationDialog.value = true
  console.log('Editor - showSegmentationDialog set to:', showSegmentationDialog.value)
}

const handleSegmentationConfirm = (method: 'punctuation' | 'paragraph' | 'ai') => {
  console.log('Editor - handleSegmentationConfirm called with method:', method, 'text:', pendingText.value)
  // 前端模拟分句，不调用后端接口
  performSegmentation(pendingText.value, method)
}

const performSegmentation = (text: string, method: 'punctuation' | 'paragraph' | 'ai') => {
  try {
    console.log('开始分句，文本:', text)
    console.log('分句方法:', method)
    
    // 使用前端分句工具进行分句
    const segments = TextSegmentation.segment(text, {
      method: method,
      minLength: 1,
      maxLength: 100,
      preserveWhitespace: true
    })

    console.log('分句结果:', segments)

    if (segments.length === 0) {
      ElMessage.warning('分句结果为空，请检查文本内容')
      return
    }

    // 为每个分句添加duration信息
    const segmentsWithDuration = segments.map((segment, index) => ({
      ...segment,
      duration: 3 // 每个分句假设3秒
    }))

    // 清空现有轨道
    clearTracks()
    console.log('Editor - tracks cleared, current tracks count:', tracks.value.length)

    // 创建一个包含所有分句的轨道
    const trackId = addTrack({
      name: `分句文本_${Date.now()}`,
      text: text, // 原始完整文本
      voice: 'zhichu',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      audioUrl: undefined, // 暂时没有音频
      duration: segmentsWithDuration.reduce((total, seg) => total + seg.duration, 0)
    })
    console.log('Editor - track created with ID:', trackId, 'current tracks count:', tracks.value.length)

    // 设置分句信息，将所有分句添加到同一个轨道
    segmentTrack(trackId, segmentsWithDuration, method)
    
    // 调试：检查轨道是否正确创建
    const createdTrack = tracks.value.find(t => t.id === trackId)
    console.log('Editor - segmentTrack called, trackId:', trackId)
    console.log('Editor - all tracks:', tracks.value.map(t => ({ id: t.id, name: t.name })))
    console.log('Editor - found track:', createdTrack)
    console.log('Editor - track segments:', createdTrack?.segments?.length)

    // 初始化间隔（如果有多个分句）
    if (segments.length > 1) {
      audioStore.initializeGaps(trackId)
      console.log('Editor - gaps initialized, track gaps:', tracks.value.find(t => t.id === trackId)?.gaps?.length)
    }

    ElMessage.success(`成功分句为 ${segments.length} 个句子`)
    
    // 切换到时间轴视图
    workflowStage.value = 'timeline'
    showSegmentsTimeline.value = true
    
    // 默认选中第一句话
    if (segmentsWithDuration.length > 0) {
      const firstSegment = segmentsWithDuration[0]
      selectedSegmentId.value = firstSegment.id
      selectedSegmentIndex.value = 0
      selectedSegment.value = firstSegment
      console.log('Editor - 默认选中第一句话:', firstSegment)
    }
    
    // 最终检查
    console.log('Editor - segmentation completed, final tracks count:', tracks.value.length)
    if (tracks.value.length > 0) {
      const track = tracks.value[0]
      console.log('Editor - final track state:', {
        id: track.id,
        isSegmented: track.isSegmented,
        segmentsCount: track.segments?.length,
        gapsCount: track.gaps?.length
      })
    }

  } catch (error) {
    console.error('分句处理失败:', error)
    ElMessage.error('分句处理失败')
  }
}

// 监控 tracks 变化
watch(tracks, (newTracks) => {
  console.log('Editor - tracks changed:', newTracks.length, 'tracks')
  if (newTracks.length > 0) {
    console.log('Editor - first track:', newTracks[0])
    if (newTracks[0].isSegmented) {
      console.log('Editor - track is segmented, segments:', newTracks[0].segments?.length)
    }
  }
}, { immediate: true, deep: true })

// 监控选中状态，如果为空且有分句数据时自动选中第一句
watch([selectedSegmentId, timelineSegments], ([newSelectedId, newSegments]) => {
  try {
    console.log('Editor - watch triggered, selectedSegmentId:', newSelectedId, 'segments count:', newSegments?.length || 0)
    // 如果当前没有选中任何句子，且有分句数据，则自动选中第一句
    if (!newSelectedId && newSegments && newSegments.length > 0) {
      const firstSegment = newSegments[0]
      if (firstSegment && firstSegment.id) {
        selectedSegmentId.value = firstSegment.id
        selectedSegmentIndex.value = 0
        selectedSegment.value = firstSegment
        // 自动打开语音编辑器
        handleOpenVoiceEditor(firstSegment)
        console.log('Editor - 自动选中第一句话并打开语音编辑器:', firstSegment)
      }
    }
  } catch (error) {
    console.error('Editor - error in watch:', error)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 初始化应用
  appStore.init()
  console.log('Editor - mounted, initial tracks:', tracks.value.length)
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

/* 顶部导航工具栏 */
.top-toolbar {
  height: 120px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主编辑区域 */
.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
}

.timeline-container {
  display: flex;
  flex-direction: column;
}

.segments-timeline-view {
  display: flex;
  flex-direction: column;
}

/* 语音编辑容器 */
.voice-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  margin-top: 24px;
}

.tracks-timeline-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.text-input-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  padding: 20px;
}

.timeline-header {
  height: 40px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  position: relative;
}

.time-ruler {
  position: relative;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, transparent 49px, #e4e7ed 50px, #e4e7ed 51px, transparent 52px);
}

.time-marker {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #909399;
  padding-left: 4px;
}

.timeline-content {
  flex: 1;
  overflow: auto;
  background: #fafafa;
}

.tracks-timeline {
  min-height: 100%;
}

.track-timeline {
  display: flex;
  height: 80px;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.track-timeline:hover {
  background-color: #f0f9ff;
}

.track-timeline.active {
  background-color: #e6f7ff;
}

.track-label {
  width: 120px;
  padding: 16px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  font-weight: 500;
  background: white;
}

.track-waveform {
  flex: 1;
  padding: 16px;
  display: flex;
  align-items: center;
}

.audio-block {
  position: relative;
  height: 40px;
  background: #f0f2f5;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-width: 200px;
}

.waveform {
  flex: 1;
  height: 20px;
  background: repeating-linear-gradient(
    90deg,
    #409eff 0px,
    #409eff 2px,
    transparent 2px,
    transparent 4px
  );
}

.duration {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.empty-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-sidebar {
    width: 60px !important;
  }
  
  .sidebar-content {
    display: none;
  }
  
  .main-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
