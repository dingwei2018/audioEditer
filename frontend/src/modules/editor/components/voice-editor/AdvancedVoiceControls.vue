<template>
  <div class="control-section combined-controls">
    <div class="combined-row">
      <!-- 音调控制 -->
      <div class="control-item pitch-control">
        <div class="control-header">
          <span class="control-label">音调</span>
        </div>
        <div class="control-content">
          <div class="slider-section">
            <el-slider
              v-model="pitch"
              :min="0.5"
              :max="2"
              :step="0.1"
              :format-tooltip="(val) => `${val}x`"
              @change="handlePitchChange"
              class="compact-slider"
            />
            <span class="value-display-small">{{ pitch }}x</span>
          </div>
        </div>
      </div>

      <!-- 停顿控制 -->
      <div class="control-item pause-control">
        <div class="control-header">
          <span class="control-label">字后停顿</span>
          <div class="pause-buttons-inline">
            <el-button
              @click="handleAddPause"
              type="success"
              size="small"
              icon="Plus"
              :disabled="!hasSelectedChar"
              class="pause-action-btn add-pause-btn"
            >
              添加
            </el-button>
            <el-button
              @click="handleRemovePause"
              type="danger"
              size="small"
              icon="Minus"
              :disabled="!hasSelectedChar"
              class="pause-action-btn remove-pause-btn"
            >
              去除
            </el-button>
          </div>
        </div>
        <div class="control-content">
          <div class="slider-section">
            <el-slider
              v-model="pauseDuration"
              :min="0.1"
              :max="3"
              :step="0.1"
              :format-tooltip="(val) => `${val}s`"
              class="compact-slider"
            />
            <span class="value-display-small">{{ pauseDuration }}s</span>
          </div>
        </div>
      </div>

      <!-- 多音字选择 -->
      <div v-if="showPolyphoneSelection" class="control-item polyphone-control">
        <div class="control-header">
          <span class="control-label">多音字设置</span>
          <div class="polyphone-buttons-inline">
            <el-button
              @click="handleCancelPronunciation"
              type="danger"
              size="small"
              icon="Close"
              :disabled="!hasSelectedChar || !selectedPronunciation"
              class="polyphone-action-btn cancel-pronunciation-btn"
              title="取消多音字设置"
            >
              取消
            </el-button>
          </div>
        </div>
        <div class="control-content">
          <div class="pronunciation-select-container">
            <el-select
              :model-value="selectedPronunciation"
              @change="handlePronunciationChange"
              placeholder="选择发音"
              class="pronunciation-select"
              size="small"
            >
              <el-option
                v-for="pronunciation in polyphoneOptions"
                :key="pronunciation.pinyin"
                :label="`${pronunciation.pinyin} (${pronunciation.tone})`"
                :value="pronunciation.pinyin"
              >
                <div class="pronunciation-option-item">
                  <span class="pinyin-select">{{ pronunciation.pinyin }}</span>
                  <span class="tone-select">{{ pronunciation.tone }}</span>
                  <span class="meaning-select">{{ pronunciation.meaning }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface PolyphoneOption {
  pinyin: string
  tone: string
  meaning: string
}

interface Props {
  initialPitch?: number
  hasSelectedChar: boolean
  showPolyphoneSelection: boolean
  polyphoneOptions: PolyphoneOption[]
  selectedPronunciation: string
}

interface Emits {
  (e: 'update-pitch', pitch: number): void
  (e: 'add-pause', duration: number): void
  (e: 'remove-pause'): void
  (e: 'update-pronunciation', pinyin: string): void
  (e: 'cancel-pronunciation'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialPitch: 1
})

const emit = defineEmits<Emits>()

// 响应式数据
const pitch = ref(props.initialPitch)
const pauseDuration = ref(1)

// 方法
function handlePitchChange(value: number) {
  emit('update-pitch', value)
}

function handleAddPause() {
  emit('add-pause', pauseDuration.value)
}

function handleRemovePause() {
  emit('remove-pause')
}

function handlePronunciationChange(pinyin: string) {
  emit('update-pronunciation', pinyin)
}

function handleCancelPronunciation() {
  emit('cancel-pronunciation')
}

// 监听属性变化
watch(() => props.initialPitch, (newPitch) => {
  pitch.value = newPitch
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

/* 停顿控制按钮样式 */
.pause-buttons-inline {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pause-action-btn {
  font-size: 11px;
  padding: 2px 6px;
  min-width: auto;
}

/* 多音字控制按钮样式 */
.polyphone-buttons-inline {
  display: flex;
  gap: 4px;
  align-items: center;
}

.polyphone-action-btn {
  font-size: 11px;
  padding: 2px 6px;
  min-width: auto;
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

/* 多音字选择样式 */
.pronunciation-select-container {
  width: 100%;
}

.pronunciation-select {
  width: 100%;
}

.pronunciation-select :deep(.el-input__inner) {
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  font-size: 12px;
}

.pronunciation-select :deep(.el-input__inner:focus) {
  border-color: #409eff;
}

.pronunciation-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
}

.pinyin-select {
  font-weight: 600;
  color: #409eff;
  min-width: 30px;
}

.tone-select {
  color: #ffa500;
  min-width: 25px;
  font-size: 11px;
}

.meaning-select {
  color: #666;
  font-size: 11px;
  flex: 1;
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

  .control-header {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pause-buttons-inline {
    align-self: center;
  }

  .control-content {
    gap: 4px;
  }

  .slider-section {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'AdvancedVoiceControls'
}
</script>