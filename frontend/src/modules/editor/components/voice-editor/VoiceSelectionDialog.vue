<template>
  <el-dialog
    v-model="visible"
    title="选择语音音色"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="voice-selection-dialog">
      <!-- 分类切换 -->
      <el-tabs v-model="activeVoiceCategory" @tab-change="handleCategoryChange">
        <el-tab-pane
          v-for="category in voiceCategories"
          :key="category.id"
          :label="category.name"
          :name="category.id"
        >
          <div class="voice-grid">
            <div
              v-for="voice in category.voices"
              :key="voice.id"
              class="voice-item"
              :class="{ selected: voice.id === selectedVoice.id }"
              @click="selectVoice(voice)"
            >
              <div class="voice-avatar">
                <img :src="voice.avatar" :alt="voice.name" />
              </div>
              <div class="voice-name">{{ voice.name }}</div>
              <div class="voice-description">{{ voice.description }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

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
  modelValue: boolean
  currentVoice: Voice
  voiceCategories: VoiceCategory[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', voice: Voice): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(props.modelValue)
const activeVoiceCategory = ref('classical')
const selectedVoice = ref<Voice>(props.currentVoice)

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue) {
    selectedVoice.value = props.currentVoice
  }
})

// 监听 visible 变化
watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

// 方法
function selectVoice(voice: Voice) {
  selectedVoice.value = voice
}

function confirmSelection() {
  emit('confirm', selectedVoice.value)
  visible.value = false
  ElMessage.success(`已切换到${selectedVoice.value.name}音色`)
}

function handleClose() {
  visible.value = false
}

function handleCategoryChange(categoryId: string) {
  activeVoiceCategory.value = categoryId
}
</script>

<style scoped>
/* 音色选择对话框 */
.voice-selection-dialog {
  min-height: 400px;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.voice-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.voice-item:hover {
  background: #e6f7ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.voice-item.selected {
  background: #e6f7ff;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.voice-item .voice-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.voice-item .voice-name {
  color: #333;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.voice-item .voice-description {
  color: #666;
  font-size: 12px;
  text-align: center;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .voice-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>