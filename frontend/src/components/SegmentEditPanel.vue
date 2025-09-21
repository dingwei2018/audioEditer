<template>
  <div class="segment-edit-panel" v-if="selectedSegment">
    <div class="panel-header">
      <h3>分句编辑</h3>
      <el-button @click="closePanel" type="text" icon="Close" />
    </div>
    
    <div class="panel-content">
      <div class="segment-info">
        <el-tag type="info" size="small">分句 #{{ segmentIndex + 1 }}</el-tag>
        <span class="segment-timing">
          {{ formatTime(selectedSegment.startTime) }} - {{ formatTime(selectedSegment.endTime) }}
          ({{ selectedSegment.duration }}s)
        </span>
      </div>
      
      <div class="edit-section">
        <h4>文本内容</h4>
        <el-input
          v-model="editText"
          type="textarea"
          :rows="3"
          placeholder="输入分句文本..."
          @blur="updateText"
        />
      </div>
      
      <div class="voice-section">
        <h4>语音设置</h4>
        <el-form :model="voiceSettings" label-width="80px" size="small">
          <el-form-item label="语音">
            <el-select v-model="voiceSettings.voice" placeholder="选择语音">
              <el-option label="知初" value="zhichu" />
              <el-option label="知美" value="zhimei" />
              <el-option label="知文" value="zhiwen" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="语速">
            <el-slider
              v-model="voiceSettings.speed"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              show-input
            />
          </el-form-item>
          
          <el-form-item label="音调">
            <el-slider
              v-model="voiceSettings.pitch"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              show-input
            />
          </el-form-item>
        </el-form>
      </div>
      
      <div class="audio-section">
        <h4>音频预览</h4>
        <div class="audio-player">
          <audio 
            ref="audioPlayer"
            :src="selectedSegment.audioUrl"
            preload="metadata"
            @loadedmetadata="onAudioLoaded"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
          />
          
          <div class="audio-controls">
            <el-button 
              @click="togglePlay"
              :type="isPlaying ? 'danger' : 'primary'"
              :icon="isPlaying ? 'VideoPause' : 'VideoPlay'"
            >
              {{ isPlaying ? '暂停' : '播放' }}
            </el-button>
            
            <div class="progress-container">
              <el-slider
                v-model="currentTime"
                :max="duration"
                :step="0.1"
                @change="seekTo"
                :show-tooltip="false"
              />
              <div class="time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="panel-footer">
      <el-button @click="regenerateAudio" :loading="isRegenerating" type="success">
        <el-icon><Refresh /></el-icon>
        重新生成语音
      </el-button>
      <el-button @click="saveChanges" type="primary">
        <el-icon><Check /></el-icon>
        保存更改
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ttsApi } from '../api/tts'

interface SegmentWithTiming {
  id: string
  text: string
  startTime: number
  endTime: number
  duration: number
  isPlaying: boolean
  audioUrl?: string
  voice?: string
  speed?: number
  pitch?: number
}

interface Props {
  selectedSegment: SegmentWithTiming | null
  segmentIndex: number
}

interface Emits {
  (e: 'close'): void
  (e: 'save', segment: SegmentWithTiming): void
  (e: 'regenerate', segmentId: string, settings: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const editText = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isRegenerating = ref(false)
const audioPlayer = ref<HTMLAudioElement>()

const voiceSettings = ref({
  voice: 'zhichu',
  speed: 1.0,
  pitch: 1.0
})

// 监听选中分句变化
watch(() => props.selectedSegment, (newSegment) => {
  if (newSegment) {
    editText.value = newSegment.text
    voiceSettings.value = {
      voice: newSegment.voice || 'zhichu',
      speed: newSegment.speed || 1.0,
      pitch: newSegment.pitch || 1.0
    }
    duration.value = newSegment.duration
    currentTime.value = 0
    isPlaying.value = false
  }
}, { immediate: true })

// 方法
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const updateText = () => {
  if (props.selectedSegment) {
    props.selectedSegment.text = editText.value
  }
}

const togglePlay = async () => {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    try {
      await audioPlayer.value.play()
    } catch (error) {
      console.error('播放失败:', error)
      ElMessage.error('音频播放失败')
    }
  }
}

const seekTo = (time: number) => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = time
  }
}

const onAudioLoaded = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

const regenerateAudio = async () => {
  if (!props.selectedSegment || !editText.value.trim()) {
    ElMessage.warning('请先输入文本内容')
    return
  }

  isRegenerating.value = true
  
  try {
    const response = await ttsApi.synthesize({
      text: editText.value,
      voice: voiceSettings.value.voice,
      speed: voiceSettings.value.speed,
      pitch: voiceSettings.value.pitch
    })

    if (response.success && response.data) {
      // 更新分句的音频数据
      if (props.selectedSegment) {
        props.selectedSegment.audioUrl = response.data.audioData
        props.selectedSegment.duration = response.data.duration
        props.selectedSegment.voice = voiceSettings.value.voice
        props.selectedSegment.speed = voiceSettings.value.speed
        props.selectedSegment.pitch = voiceSettings.value.pitch
      }
      
      ElMessage.success('语音重新生成成功')
      
      // 重新加载音频
      await nextTick()
      if (audioPlayer.value) {
        audioPlayer.value.load()
      }
    } else {
      ElMessage.error('语音生成失败')
    }
  } catch (error) {
    console.error('语音生成失败:', error)
    ElMessage.error('语音生成失败')
  } finally {
    isRegenerating.value = false
  }
}

const saveChanges = () => {
  if (props.selectedSegment) {
    // 更新分句数据
    props.selectedSegment.text = editText.value
    props.selectedSegment.voice = voiceSettings.value.voice
    props.selectedSegment.speed = voiceSettings.value.speed
    props.selectedSegment.pitch = voiceSettings.value.pitch
    
    emit('save', props.selectedSegment)
    ElMessage.success('更改已保存')
  }
}

const closePanel = () => {
  emit('close')
}
</script>

<script lang="ts">
export default {
  name: 'SegmentEditPanel'
}
</script>

<style scoped>
.segment-edit-panel {
  width: 350px;
  height: 100%;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.segment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #b3d8ff;
}

.segment-timing {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.edit-section,
.voice-section,
.audio-section {
  margin-bottom: 24px;
}

.edit-section h4,
.voice-section h4,
.audio-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.audio-player {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-display {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
  display: flex;
  gap: 8px;
}

.panel-footer .el-button {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .segment-edit-panel {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1000;
  }
}
</style>
