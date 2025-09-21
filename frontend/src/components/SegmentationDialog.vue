<template>
  <el-dialog
    v-model="visible"
    title=""
    width="400px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="segmentation-dialog"
  >
    <div class="dialog-content">
      <div class="options-list">
        <div 
          v-for="option in options" 
          :key="option.value"
          class="option-item"
          :class="{ selected: selectedMethod === option.value }"
          @click="selectMethod(option.value)"
        >
          <div class="radio-circle">
            <div v-if="selectedMethod === option.value" class="radio-dot"></div>
          </div>
          <div class="option-content">
            <span v-if="option.icon" class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.label }}</span>
          </div>
        </div>
      </div>
      
      <div class="confirm-button">
        <el-button 
          @click="confirmSelection"
          :disabled="!selectedMethod"
          class="confirm-btn"
        >
          确认
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface SegmentationOption {
  value: 'punctuation' | 'paragraph' | 'ai'
  label: string
  icon?: string
}

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', method: 'punctuation' | 'paragraph' | 'ai'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const selectedMethod = ref<'punctuation' | 'paragraph' | 'ai' | null>(null)

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const options: SegmentationOption[] = [
  { value: 'punctuation', label: '按标点' },
  { value: 'paragraph', label: '按段落' },
  { value: 'ai', label: '自动', icon: 'ai' }
]

// 方法
const selectMethod = (method: 'punctuation' | 'paragraph' | 'ai') => {
  selectedMethod.value = method
}

const confirmSelection = () => {
  if (selectedMethod.value) {
    emit('confirm', selectedMethod.value)
    visible.value = false
    selectedMethod.value = null
  } else {
  }
}
</script>

<script lang="ts">
export default {
  name: 'SegmentationDialog'
}
</script>

<style scoped>
.segmentation-dialog :deep(.el-dialog) {
  background: #ffffff;
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.segmentation-dialog :deep(.el-dialog__header) {
  display: none;
}

.segmentation-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.segmentation-dialog :deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  padding: 24px;
  background: #ffffff;
  color: #333333;
}

.options-list {
  margin-bottom: 24px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
}

.option-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.option-item.selected {
  border-color: #409eff;
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.radio-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #d9d9d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: #ffffff;
}

.option-item.selected .radio-circle {
  border-color: #409eff;
  background: #ffffff;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-icon {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
}

.option-text {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
}

.confirm-button {
  text-align: center;
}

.confirm-btn {
  background: #409eff;
  border-color: #409eff;
  color: white;
  padding: 10px 36px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  min-width: 100px;
}

.confirm-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.confirm-btn:disabled {
  background: #c0c4cc;
  border-color: #c0c4cc;
  color: #ffffff;
  cursor: not-allowed;
}
</style>
