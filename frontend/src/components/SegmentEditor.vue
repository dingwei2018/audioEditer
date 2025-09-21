<template>
  <el-dialog
    v-model="visible"
    title="分句编辑"
    width="80%"
    :before-close="handleClose"
  >
    <div class="segment-editor">
      <div class="editor-header">
        <div class="track-info">
          <h3>{{ track?.name }}</h3>
          <el-tag type="success" size="small">
            {{ getSegmentMethodLabel(track?.segmentMethod) }}
          </el-tag>
        </div>
        <div class="header-actions">
          <el-button @click="addNewSegment" type="primary" size="small">
            <el-icon><Plus /></el-icon>
            添加分句
          </el-button>
          <el-button @click="regenerateAll" type="success" size="small" :loading="isRegenerating">
            <el-icon><Refresh /></el-icon>
            重新生成
          </el-button>
        </div>
      </div>

      <div class="segments-list">
        <div 
          v-for="(segment, index) in segments" 
          :key="segment.id"
          class="segment-item"
        >
          <div class="segment-header">
            <div class="segment-number">分句 {{ index + 1 }}</div>
            <div class="segment-actions">
              <el-button 
                @click="playSegment(segment.id)" 
                type="text" 
                size="small"
                :icon="segment.isPlaying ? 'VideoPause' : 'VideoPlay'"
              />
              <el-button 
                @click="regenerateSegment(segment.id)" 
                type="text" 
                size="small"
                :loading="segment.isRegenerating"
                icon="Refresh"
              />
              <el-button 
                @click="removeSegment(segment.id)" 
                type="text" 
                size="small"
                icon="Delete"
              />
            </div>
          </div>
          
          <div class="segment-content">
            <el-input
              v-model="segment.text"
              type="textarea"
              :rows="2"
              placeholder="输入分句文本..."
              @blur="updateSegmentText(segment.id, segment.text)"
            />
            
            <div class="segment-audio" v-if="segment.audioUrl">
              <audio 
                :ref="`audio_${segment.id}`"
                :src="segment.audioUrl"
                preload="metadata"
                @loadedmetadata="onAudioLoaded(segment.id, $event)"
                @timeupdate="onTimeUpdate(segment.id, $event)"
              />
              <div class="audio-controls">
                <div class="audio-info">
                  <span>时长: {{ segment.duration || 0 }}s</span>
                </div>
                <div class="audio-waveform">
                  <div class="waveform-bar" v-for="i in 20" :key="i"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="saveChanges">保存更改</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { TextSegment } from '../utils/textSegmentation'
import type { AudioTrack } from '../stores/audio'
import { ttsApi } from '../api/tts'

interface SegmentWithAudio extends TextSegment {
  audioUrl?: string
  duration?: number
  isPlaying: boolean
  isRegenerating: boolean
}

interface Props {
  modelValue: boolean
  track: AudioTrack | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', trackId: string, segments: TextSegment[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const segments = ref<SegmentWithAudio[]>([])
const isRegenerating = ref(false)

// 监听track变化，初始化segments
watch(() => props.track, (newTrack) => {
  if (newTrack && newTrack.segments) {
    segments.value = newTrack.segments.map(segment => ({
      ...segment,
      audioUrl: newTrack.audioUrl,
      duration: newTrack.duration,
      isPlaying: false,
      isRegenerating: false
    }))
  }
}, { immediate: true })

// 方法
const getSegmentMethodLabel = (method?: string) => {
  const labels = {
    punctuation: '标点分句',
    paragraph: '段落分句',
    ai: 'AI分句'
  }
  return labels[method as keyof typeof labels] || '未知'
}

const updateSegmentText = (segmentId: string, newText: string) => {
  const segment = segments.value.find(s => s.id === segmentId)
  if (segment) {
    segment.text = newText
  }
}

const addNewSegment = () => {
  const newSegment: SegmentWithAudio = {
    id: `segment_${Date.now()}`,
    text: '',
    startIndex: 0,
    endIndex: 0,
    type: 'sentence',
    isPlaying: false,
    isRegenerating: false
  }
  segments.value.push(newSegment)
}

const removeSegment = (segmentId: string) => {
  const index = segments.value.findIndex(s => s.id === segmentId)
  if (index > -1) {
    segments.value.splice(index, 1)
  }
}

const playSegment = (segmentId: string) => {
  const segment = segments.value.find(s => s.id === segmentId)
  if (!segment) return

  // 停止其他分句的播放
  segments.value.forEach(s => {
    if (s.id !== segmentId) {
      s.isPlaying = false
    }
  })

  segment.isPlaying = !segment.isPlaying
  
  const audioElement = document.querySelector(`audio[data-segment="${segmentId}"]`) as HTMLAudioElement
  if (audioElement) {
    if (segment.isPlaying) {
      audioElement.play()
    } else {
      audioElement.pause()
    }
  }
}

const regenerateSegment = async (segmentId: string) => {
  const segment = segments.value.find(s => s.id === segmentId)
  if (!segment || !segment.text.trim()) {
    ElMessage.warning('请先输入分句文本')
    return
  }

  segment.isRegenerating = true
  
  try {
    const response = await ttsApi.synthesize({
      text: segment.text,
      voice: props.track?.voice || 'zhichu',
      speed: props.track?.speed || 1.0,
      pitch: props.track?.pitch || 1.0
    })

    if (response.success && response.data) {
      segment.audioUrl = response.data.audioData
      segment.duration = response.data.duration
      ElMessage.success('分句语音重新生成成功')
    } else {
      ElMessage.error('分句语音生成失败')
    }
  } catch (error) {
    console.error('分句语音生成失败:', error)
    ElMessage.error('分句语音生成失败')
  } finally {
    segment.isRegenerating = false
  }
}

const regenerateAll = async () => {
  if (!props.track) return

  isRegenerating.value = true
  
  try {
    for (const segment of segments.value) {
      if (segment.text.trim()) {
        await regenerateSegment(segment.id)
      }
    }
    ElMessage.success('所有分句语音重新生成完成')
  } catch (error) {
    console.error('批量重新生成失败:', error)
    ElMessage.error('批量重新生成失败')
  } finally {
    isRegenerating.value = false
  }
}

const onAudioLoaded = (segmentId: string, event: Event) => {
  const audio = event.target as HTMLAudioElement
  const segment = segments.value.find(s => s.id === segmentId)
  if (segment) {
    segment.duration = audio.duration
  }
}

const onTimeUpdate = (segmentId: string, event: Event) => {
  // 可以在这里添加播放进度更新逻辑
}

const saveChanges = () => {
  if (!props.track) return

  const textSegments: TextSegment[] = segments.value.map(segment => ({
    id: segment.id,
    text: segment.text,
    startIndex: segment.startIndex,
    endIndex: segment.endIndex,
    type: segment.type
  }))

  emit('save', props.track.id, textSegments)
  ElMessage.success('分句更改已保存')
  handleClose()
}

const handleClose = () => {
  visible.value = false
}
</script>

<script lang="ts">
export default {
  name: 'SegmentEditor'
}
</script>

<style scoped>
.segment-editor {
  max-height: 70vh;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.segment-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.segment-number {
  font-weight: 600;
  color: #606266;
}

.segment-actions {
  display: flex;
  gap: 4px;
}

.segment-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-audio {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.audio-info {
  font-size: 12px;
  color: #909399;
  min-width: 80px;
}

.audio-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  height: 20px;
}

.waveform-bar {
  width: 3px;
  background: #409eff;
  border-radius: 1px;
  height: 100%;
  animation: waveform 1s ease-in-out infinite alternate;
}

.waveform-bar:nth-child(odd) {
  animation-delay: 0.1s;
}

.waveform-bar:nth-child(even) {
  animation-delay: 0.3s;
}

@keyframes waveform {
  0% { height: 20%; }
  100% { height: 100%; }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
