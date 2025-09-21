<template>
  <div class="text-input-stage">
    <TextInputArea @start-segmentation="handleStartSegmentation" />
    <SegmentationDialog
      v-model="showSegmentationDialog"
      @confirm="handleSegmentationConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TextInputArea from '@/components/TextInputArea.vue'
import SegmentationDialog from '@/components/SegmentationDialog.vue'

interface Emits {
  (e: 'start-segmentation', text: string): void
  (e: 'segmentation-confirm', method: 'punctuation' | 'paragraph' | 'ai', text: string): void
}

const emit = defineEmits<Emits>()

const showSegmentationDialog = ref(false)
const pendingText = ref('')

// 处理开始分句事件
const handleStartSegmentation = (text: string) => {
  pendingText.value = text
  showSegmentationDialog.value = true
  emit('start-segmentation', text)
}

// 处理分句方式确认事件
const handleSegmentationConfirm = (method: 'punctuation' | 'paragraph' | 'ai') => {
  emit('segmentation-confirm', method, pendingText.value)
  showSegmentationDialog.value = false
}

const openSegmentationDialog = () => {
  showSegmentationDialog.value = true
}

defineExpose({ openSegmentationDialog })
</script>

<style scoped>
.text-input-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  padding: 20px;
}
</style>