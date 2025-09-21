<template>
  <div class="text-input-area">
    <div class="input-container">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="8"
        placeholder="请输入要转换为语音的文本内容..."
        class="text-input"
      />
    </div>
    
    <div class="action-container">
      <el-button 
        @click="startSegmentation"
        :disabled="!inputText.trim()"
        class="start-button"
      >
        开始分句
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Emits {
  (e: 'start-segmentation', text: string): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const inputText = ref('欢迎使用云听文转声精修界面！这是一个基于阿里云 CosyVoice 技术的智能音频编辑器，可以帮助您将文本转换为自然流畅的语音。您可以在这里输入要转换的文本内容，然后点击"开始分句"按钮进行语音合成。欢迎使用云听文转声精修界面！这是一个基于阿里云 CosyVoice 技术的智能音频编辑器，可以帮助您将文本转换为自然流畅的语音。您可以在这里输入要转换的文本内容，然后点击"开始分句"按钮进行语音合成。')

// 方法
const startSegmentation = () => {
  
  if (inputText.value.trim()) {
    const trimmedText = inputText.value.trim()
    emit('start-segmentation', trimmedText)
  } else {
  }
}
</script>

<script lang="ts">
export default {
  name: 'TextInputArea'
}
</script>

<style scoped>
.text-input-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #1a1a1a;
  color: white;
}

.input-container {
  flex: 1;
}

.text-input :deep(.el-textarea__inner) {
  background: #1a1a1a;
  border: 1px solid white;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  line-height: 1.6;
  padding: 16px;
  resize: none;
}

.text-input :deep(.el-textarea__inner::placeholder) {
  color: #00ff00;
  font-size: 16px;
}

.text-input :deep(.el-textarea__inner:focus) {
  border-color: #00ff00;
  box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.2);
}

.action-container {
  display: flex;
  justify-content: center;
}

.start-button {
  background: transparent;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 20px 60px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 200px;
  height: 60px;
}

.start-button:hover:not(:disabled) {
  background: #00ff00;
  color: #1a1a1a;
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
}

.start-button:disabled {
  border-color: #666;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
