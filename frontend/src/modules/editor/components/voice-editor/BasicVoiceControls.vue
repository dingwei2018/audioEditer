<template>
  <div class="control-section combined-controls">
    <div class="combined-row">
      <!-- 音色选择 -->
      <div class="control-item voice-control">
        <div class="control-header">
          <span class="control-label">音色</span>
        </div>
        <div class="control-content">
          <div class="current-voice-compact">
            <div class="voice-avatar-small">
              <img :src="currentVoice.avatar" :alt="currentVoice.name" />
            </div>
            <div class="voice-info-compact">
              <div class="voice-name-small">{{ currentVoice.name }}</div>
            </div>
            <el-button
              @click="showVoiceDialog = true"
              type="primary"
              size="small"
              icon="User"
              class="change-voice-btn"
            >
              更换
            </el-button>
          </div>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="control-item volume-control">
        <div class="control-header">
          <span class="control-label">音量</span>
        </div>
        <div class="control-content">
          <div class="slider-section">
            <el-slider
              v-model="volume"
              :min="0"
              :max="1"
              :step="0.01"
              :format-tooltip="(val) => `${Math.round(val * 100)}%`"
              @change="handleVolumeChange"
              class="compact-slider"
            />
            <span class="value-display-small">{{ Math.round(volume * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- 语速控制 -->
      <div class="control-item speed-control">
        <div class="control-header">
          <span class="control-label">语速</span>
        </div>
        <div class="control-content">
          <div class="slider-section">
            <el-slider
              v-model="speed"
              :min="0.5"
              :max="5"
              :step="0.1"
              :format-tooltip="(val) => `${val}x`"
              @change="handleSpeedChange"
              class="compact-slider"
            />
            <span class="value-display-small">{{ speed }}x</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 语音音色选择对话框 -->
  <VoiceSelectionDialog
    v-model="showVoiceDialog"
    :current-voice="currentVoice"
    :voice-categories="voiceCategories"
    @confirm="handleVoiceConfirm"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VoiceSelectionDialog from './VoiceSelectionDialog.vue'

interface Voice {
  id: string
  name: string
  category: string
  avatar: string
  description?: string
  ssmlName: string
}

interface VoiceCategory {
  id: string
  name: string
  voices: Voice[]
}

interface Props {
  currentVoice: Voice
  initialVolume?: number
  initialSpeed?: number
  voiceCategories: VoiceCategory[]
}

interface Emits {
  (e: 'update-voice', voice: Voice): void
  (e: 'update-volume', volume: number): void
  (e: 'update-speed', speed: number): void
}

const props = withDefaults(defineProps<Props>(), {
  initialVolume: 1,
  initialSpeed: 1
})

const emit = defineEmits<Emits>()

// 响应式数据
const showVoiceDialog = ref(false)
const volume = ref(props.initialVolume)
const speed = ref(props.initialSpeed)

// 方法
function handleVoiceConfirm(voice: Voice) {
  emit('update-voice', voice)
}

function handleVolumeChange(value: number) {
  emit('update-volume', value)
}

function handleSpeedChange(value: number) {
  emit('update-speed', value)
}

// 监听属性变化
watch(() => props.initialVolume, (newVolume) => {
  volume.value = newVolume
})

watch(() => props.initialSpeed, (newSpeed) => {
  speed.value = newSpeed
})
</script>

<style scoped>
/* 语音控制区域 */
.control-section {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
}

/* 合并控制区域样式 */
.combined-controls {
  padding: 20px;
}

/* 统一控制项样式 */
.control-item {
  background: #333;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100px;
  width: 292px;
  min-width: 292px;
  max-width: 300px;
  flex-shrink: 0;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-section .compact-slider {
  flex: 1;
  margin: 0;
}

.slider-section .value-display-small {
  font-size: 11px;
  min-width: 30px;
  text-align: center;
}

.combined-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-start;
}

.control-label {
  color: #cccccc;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

/* 音色控制样式 */
.current-voice-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #333;
  border-radius: 8px;
  border: 1px solid #444;
}

.voice-avatar-small img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.voice-info-compact {
  flex: 1;
}

.voice-name-small {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.change-voice-btn {
  font-size: 12px;
  padding: 4px 8px;
}

.value-display-small {
  color: #409eff;
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  background: #333;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #444;
  min-width: 50px;
}

/* 滑块样式覆盖 */
:deep(.el-slider__runway) {
  background-color: #444;
}

:deep(.el-slider__bar) {
  background-color: #409eff;
}

:deep(.el-slider__button) {
  border-color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .combined-row {
    gap: 12px;
  }

  .control-item {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .combined-row {
    flex-direction: column;
    gap: 16px;
  }

  .control-item {
    width: 100%;
    min-width: auto;
    max-width: none;
  }

  .current-voice-compact {
    justify-content: space-between;
  }

  .change-voice-btn {
    flex-shrink: 0;
  }

  .slider-section {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
}
</style>