<template>
  <div class="timeline-segments">
    <!-- 时间轴显示组件 -->
    <TimelineDisplay
      :segments="segments"
      :gaps="gaps"
      :total-duration="totalDuration"
      :selected-segment-id="selectedSegmentId"
      :playing-segment-id="playingSegmentId"
      :selected-gap-id="selectedGapId"
      @select-segment="handleSegmentSelect"
      @edit-segment-start="handleEditStart"
      @edit-segment-finish="handleEditFinish"
      @edit-segment-cancel="handleEditCancel"
      @synthesize-audio="handleSynthesizeAudio"
      @play-audio="handlePlayAudio"
      @add-sentence-after="handleAddSentenceAfter"
      @delete-segment="handleDeleteSegment"
      @select-gap="handleGapSelect"
    />

    <!-- 间隔设置对话框 -->
    <el-dialog
      v-model="showGapDialog"
      title="调整间隔"
      width="400px"
      custom-class="gap-setting-dialog"
    >
      <div class="gap-dialog-content">
        <div class="gap-info">
          <span>当前间隔：{{ currentGap?.duration || 0 }}秒</span>
        </div>
        <div class="gap-slider-container">
          <el-slider
            v-model="gapDuration"
            :min="0"
            :max="5"
            :step="0.1"
            :format-tooltip="formatGapTooltip"
            show-input
            :show-input-controls="true"
            class="gap-duration-slider"
          />
        </div>
        <div class="gap-presets">
          <span class="preset-label">快速设置：</span>
          <el-button-group class="preset-buttons">
            <el-button
              v-for="preset in gapPresets"
              :key="preset"
              @click="gapDuration = preset"
              size="small"
              :type="gapDuration === preset ? 'primary' : 'default'"
            >
              {{ preset }}s
            </el-button>
          </el-button-group>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeGapDialog">取消</el-button>
          <el-button type="primary" @click="confirmGapChange">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TimelineDisplay from './TimelineDisplay.vue'
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

interface SegmentGap {
  id: string
  beforeSegmentId: string
  afterSegmentId: string
  duration: number
  isSelected: boolean
  startTime: number
  endTime: number
}

interface Props {
  segments: SegmentWithTiming[]
  gaps?: SegmentGap[]
  selectedSegmentId?: string
  playingSegmentId?: string
  selectedGapId?: string
}

interface Emits {
  (e: 'segment-select', segment: SegmentWithTiming): void
  (e: 'segment-edit', segmentId: string, newText: string): void
  (e: 'segment-delete', segmentId: string): void
  (e: 'segment-add-after', segmentId: string, index: number): void
  (e: 'audio-synthesize', segment: SegmentWithTiming): void
  (e: 'audio-play', segment: SegmentWithTiming): void
  (e: 'gap-select', gap: SegmentGap): void
  (e: 'gap-update', gapId: string, duration: number): void
}

const props = withDefaults(defineProps<Props>(), {
  gaps: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const showGapDialog = ref(false)
const gapDuration = ref(1)
const currentGap = ref<SegmentGap | null>(null)

// 间隔预设值
const gapPresets = [0.2, 0.5, 1, 1.5, 2, 3]

// 计算属性
const totalDuration = computed(() => {
  if (!props.segments || props.segments.length === 0) {
    return 0
  }

  const lastSegment = props.segments[props.segments.length - 1]
  return lastSegment ? lastSegment.endTime : 0
})

// 方法
function handleSegmentSelect(segment: SegmentWithTiming) {
  emit('segment-select', segment)
}

function handleEditStart(segmentId: string, text: string) {
  // 直接透传，不使用弹框
  console.log('TimelineSegments - handleEditStart:', segmentId, text)
}

function handleEditFinish(segmentId: string, text: string) {
  console.log('TimelineSegments - handleEditFinish:', segmentId, text)
  emit('segment-edit', segmentId, text)
}

function handleEditCancel(segmentId: string) {
  console.log('TimelineSegments - handleEditCancel:', segmentId)
  // 取消编辑，不做任何操作
}

function handleSynthesizeAudio(segment: SegmentWithTiming) {
  emit('audio-synthesize', segment)
}

function handlePlayAudio(segment: SegmentWithTiming) {
  emit('audio-play', segment)
}

function handleAddSentenceAfter(segmentId: string, index: number) {
  emit('segment-add-after', segmentId, index)
}

function handleDeleteSegment(segmentId: string) {
  emit('segment-delete', segmentId)
}

function handleGapSelect(gap: SegmentGap) {
  currentGap.value = gap
  gapDuration.value = gap.duration
  showGapDialog.value = true
  emit('gap-select', gap)
}

function formatGapTooltip(value: number): string {
  return `${value}秒`
}

function confirmGapChange() {
  if (currentGap.value) {
    emit('gap-update', currentGap.value.id, gapDuration.value)
    ElMessage.success(`间隔已调整为 ${gapDuration.value} 秒`)
  }
  closeGapDialog()
}

function closeGapDialog() {
  showGapDialog.value = false
  currentGap.value = null
  gapDuration.value = 1
}

// 监听segments变化
watch(() => props.segments, (newSegments) => {
  if (newSegments && newSegments.length > 0) {
    console.log('TimelineSegments - segments updated:', newSegments.length, 'segments')
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.timeline-segments {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

/* 间隔设置对话框样式 */
:deep(.gap-setting-dialog) {
  background: #2a2a2a;
  color: white;
}

:deep(.gap-setting-dialog .el-dialog__header) {
  background: #333;
  color: white;
  border-bottom: 1px solid #444;
}

:deep(.gap-setting-dialog .el-dialog__body) {
  background: #2a2a2a;
  padding: 20px;
}

:deep(.gap-setting-dialog .el-dialog__footer) {
  background: #333;
  border-top: 1px solid #444;
}

.gap-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gap-info {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #67c23a;
}

.gap-slider-container {
  padding: 0 10px;
}

.gap-duration-slider {
  width: 100%;
}

.gap-presets {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.preset-label {
  font-size: 14px;
  color: #909399;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.gap-setting-dialog) {
    width: 80% !important;
  }

  .preset-buttons {
    gap: 6px;
  }
}
</style>