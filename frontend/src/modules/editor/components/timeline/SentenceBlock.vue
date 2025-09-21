<template>
  <div
    class="sentence-block"
    :class="{
      active: isSelected,
      playing: isPlaying,
      editing: isEditing
    }"
    @click="$emit('select', segment)"
    @dblclick="startEdit"
  >
    <div class="sentence-content">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="sentence-edit">
        <el-input
          v-model="localEditingText"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="输入句子内容..."
          @blur="finishEdit"
          @keydown.enter="handleEnterKey"
          @keydown.escape="cancelEdit"
          ref="editInput"
          class="sentence-edit-input"
        />
      </div>
      <!-- 显示模式 -->
      <div v-else>
        <div class="sentence-text">{{ segment.text }}</div>
        <div class="sentence-info">
          <span class="sentence-duration">{{ segment.duration }}s</span>
          <span class="sentence-index">#{{ index + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="isSelected && !isEditing" class="sentence-actions">
      <el-button
        @click.stop="$emit('synthesize', segment)"
        type="success"
        size="small"
        icon="Microphone"
        circle
        class="action-btn synthesize-btn"
        title="合成音频"
      />
      <el-button
        @click.stop="$emit('play', segment)"
        type="info"
        size="small"
        icon="VideoPlay"
        circle
        class="action-btn play-btn"
        title="播放音频"
        :disabled="!segment.audioUrl"
      />
      <el-button
        @click.stop="handleAddAfterClick"
        type="primary"
        size="small"
        icon="Plus"
        circle
        class="action-btn add-btn"
        title="在此句后添加新句子"
      />
      <el-button
        v-if="showAddGapButton"
        @click.stop="handleAddGapClick"
        type="warning"
        size="small"
        icon="Clock"
        circle
        class="action-btn add-gap-btn"
        title="在此句后添加间隔"
      />
      <el-button
        @click.stop="$emit('delete', segment.id)"
        type="danger"
        size="small"
        icon="Delete"
        circle
        class="action-btn delete-btn"
        title="删除此句子"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { TextSegment } from '@/utils/textSegmentation'

interface SegmentWithTiming extends TextSegment {
  startTime: number
  endTime: number
  duration: number
  isPlaying: boolean
  audioUrl?: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  ssml?: string
}

interface Props {
  segment: SegmentWithTiming
  index: number
  isSelected: boolean
  isPlaying: boolean
  isEditing: boolean
  editingText?: string
  totalSegments?: number
  hasGapAfter?: boolean
}

interface Emits {
  (e: 'select', segment: SegmentWithTiming): void
  (e: 'edit-start', segmentId: string, text: string): void
  (e: 'edit-finish', segmentId: string, text: string): void
  (e: 'edit-cancel', segmentId: string): void
  (e: 'synthesize', segment: SegmentWithTiming): void
  (e: 'play', segment: SegmentWithTiming): void
  (e: 'add-after', segmentId: string, index: number): void
  (e: 'add-gap', segmentId: string, index: number): void
  (e: 'delete', segmentId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const editInput = ref<any>(null)
const localEditingText = ref('')
const isFinishing = ref(false)  // 防止重复调用

// 监听editingText变化
watch(() => props.editingText, (newText) => {
  console.log('SentenceBlock - watch editingText changed:', newText)
  if (newText !== undefined && props.isEditing) {
    localEditingText.value = newText
    console.log('SentenceBlock - localEditingText updated to:', localEditingText.value)
  }
}, { immediate: true })

// 监听编辑状态变化，重置finishing标志
watch(() => props.isEditing, (newEditing) => {
  if (!newEditing) {
    isFinishing.value = false
  }
})

// 计算属性
const showAddGapButton = computed(() => {
  // 只有在不是最后一个句子且没有间隔时显示添加间隔按钮
  return props.totalSegments &&
         props.index < props.totalSegments - 1 &&
         !props.hasGapAfter
})

// 方法
function startEdit() {
  localEditingText.value = props.segment.text
  isFinishing.value = false  // 重置标志
  console.log('SentenceBlock - startEdit:', props.segment.id, props.segment.text)
  emit('edit-start', props.segment.id, props.segment.text)

  // 延迟聚焦，确保DOM已更新
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  })
}

function finishEdit() {
  // 防止重复调用
  if (isFinishing.value) {
    console.log('SentenceBlock - finishEdit: already finishing, ignoring duplicate call')
    return
  }

  isFinishing.value = true

  console.log('SentenceBlock - finishEdit: localEditingText.value =', localEditingText.value)
  console.log('SentenceBlock - finishEdit: localEditingText.value.length =', localEditingText.value.length)

  const trimmedText = localEditingText.value.trim()
  console.log('SentenceBlock - finishEdit: trimmedText =', trimmedText)
  console.log('SentenceBlock - finishEdit: trimmedText.length =', trimmedText.length)

  emit('edit-finish', props.segment.id, trimmedText)
}

function handleEnterKey(event: KeyboardEvent) {
  // 阻止默认行为（换行）
  event.preventDefault()

  console.log('SentenceBlock - handleEnterKey triggered')
  console.log('SentenceBlock - handleEnterKey: localEditingText.value =', localEditingText.value)

  // 只有在没有按住Shift键时才完成编辑（Shift+Enter允许换行）
  if (!event.shiftKey) {
    finishEdit()
  }
}

function cancelEdit() {
  isFinishing.value = false  // 重置标志
  localEditingText.value = props.segment.text
  console.log('SentenceBlock - cancelEdit:', props.segment.id)
  emit('edit-cancel', props.segment.id)
}

function handleAddAfterClick() {
  console.log('=== SentenceBlock - handleAddAfterClick ===')
  console.log('segment.id:', props.segment.id)
  console.log('index from props:', props.index)
  console.log('segment.text:', props.segment.text)
  emit('add-after', props.segment.id, props.index)
}

function handleAddGapClick() {
  console.log('=== SentenceBlock - handleAddGapClick ===')
  console.log('segment.id:', props.segment.id)
  console.log('index from props:', props.index)
  console.log('segment.text:', props.segment.text)
  emit('add-gap', props.segment.id, props.index)
}
</script>

<style scoped>
.sentence-block {
  position: relative;
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 80vw;
  width: max-content;
  height: auto;
  min-height: 60px;
  flex-shrink: 0;
  z-index: 2;
}

.sentence-block:hover {
  border-color: #409eff;
  background: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.sentence-block.active {
  border-color: #409eff;
  background: #1e3a5f;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.sentence-block.playing {
  border-color: #67c23a;
  background: #1e3a5f;
  animation: pulse 1.5s ease-in-out infinite;
}

.sentence-block.editing {
  border-color: #e6a23c;
  background: #2d2a1f;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(103, 194, 58, 0.5);
  }
}

.sentence-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;
}

.sentence-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
}

.sentence-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 4px;
}

.sentence-duration {
  color: #67c23a;
  font-weight: 500;
  white-space: nowrap;
}

.sentence-index {
  color: #909399;
  background: #444;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 编辑模式样式 */
.sentence-edit {
  width: 100%;
}

.sentence-edit-input {
  width: 100%;
}

.sentence-edit-input :deep(.el-textarea__inner) {
  background: #1a1a1a;
  border: 1px solid #e6a23c;
  color: white;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
}

.sentence-edit-input :deep(.el-textarea__inner):focus {
  border-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

/* 句子操作按钮 */
.sentence-actions {
  position: absolute;
  top: -15px;
  right: -15px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.add-btn {
  background: #67c23a;
  border-color: #67c23a;
}

.add-btn:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.delete-btn {
  background: #f56c6c;
  border-color: #f56c6c;
}

.delete-btn:hover {
  background: #f78989;
  border-color: #f78989;
}

.synthesize-btn {
  background: #67c23a;
  border-color: #67c23a;
}

.synthesize-btn:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.play-btn {
  background: #409eff;
  border-color: #409eff;
}

.play-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.play-btn:disabled {
  background: #c0c4cc;
  border-color: #c0c4cc;
  cursor: not-allowed;
}

.play-btn:disabled:hover {
  background: #c0c4cc;
  border-color: #c0c4cc;
  transform: none;
}
</style>