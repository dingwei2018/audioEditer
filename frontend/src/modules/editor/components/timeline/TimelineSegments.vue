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
      @add-gap="handleAddGap"
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
        <div class="gap-input-container">
          <span class="input-label">间隔时长（秒）：</span>
          <el-input-number
            v-model="gapDuration"
            :min="0"
            :step="0.1"
            :precision="1"
            controls-position="right"
            class="gap-duration-input"
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
          <div class="dialog-left-actions">
            <el-button @click="resetGap" type="info">重置为1秒</el-button>
            <el-button @click="removeGap" type="danger">删除间隔</el-button>
          </div>
          <div class="dialog-right-actions">
            <el-button type="primary" @click="confirmGapChange">确认</el-button>
            <el-button @click="closeGapDialog">取消</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  (e: 'segment-edit', data: { segmentId: string, newText: string }): void
  (e: 'segment-delete', segmentId: string): void
  (e: 'segment-add-after', segmentId: string, index: number): void
  (e: 'gap-add', beforeSegmentId: string, afterSegmentId: string): void
  (e: 'audio-synthesize', segment: SegmentWithTiming): void
  (e: 'audio-play', segment: SegmentWithTiming): void
  (e: 'gap-select', gap: SegmentGap): void
  (e: 'gap-update', gapId: string, duration: number): void
  (e: 'gap-remove', gapId: string): void
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
const gapPresets = [0.2, 0.5, 1, 2, 3, 5, 10]

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

  // 验证参数
  if (!segmentId) {
    console.error('TimelineSegments - segmentId is missing')
    return
  }
  if (text === undefined || text === null) {
    console.error('TimelineSegments - text is undefined or null')
    return
  }

  emit('segment-edit', { segmentId, newText: text })
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

function handleAddGap(beforeSegmentId: string, afterSegmentId: string) {
  emit('gap-add', beforeSegmentId, afterSegmentId)
}

function handleDeleteSegment(segmentId: string) {
  emit('segment-delete', segmentId)
}

function handleGapSelect(gap: any) {
  console.log('=== TimelineSegments - handleGapSelect START ===')
  console.log('TimelineSegments - handleGapSelect received gap:', gap)
  console.log('TimelineSegments - gap.duration type:', typeof gap.duration, 'value:', gap.duration)
  console.log('TimelineSegments - available props.gaps:', props.gaps)

  // 先清理所有 NaN 数据（临时修复方案）
  // TODO: 这个应该在应用启动时调用，这里是紧急修复
  if (props.gaps && props.gaps.some(g => isNaN(g.duration))) {
    console.log('WARNING: Detected NaN in props.gaps, attempting cleanup...')
    props.gaps.forEach((g, index) => {
      if (isNaN(g.duration)) {
        console.log(`Fixing NaN in gap ${index}, setting to 1`)
        g.duration = 1
      }
    })
  }

  // 从临时gap对象中提取信息，查找真正的gap数据
  let realGap = null

  if (props.gaps && props.gaps.length > 0) {
    // 优先通过beforeSegmentId查找，因为这是最准确的方法
    if (gap.beforeSegmentId) {
      realGap = props.gaps.find(g => g.beforeSegmentId === gap.beforeSegmentId)
      console.log('TimelineSegments - searching by beforeSegmentId:', gap.beforeSegmentId, 'found:', realGap)
      if (realGap) {
        console.log('Real gap duration type:', typeof realGap.duration, 'value:', realGap.duration)
      }
    }

    // 如果通过beforeSegmentId找不到，尝试通过ID直接查找
    if (!realGap && gap.id) {
      realGap = props.gaps.find(g => g.id === gap.id)
      console.log('TimelineSegments - searching by id:', gap.id, 'found:', realGap)
      if (realGap) {
        console.log('Real gap duration type (by id):', typeof realGap.duration, 'value:', realGap.duration)
      }
    }

    // 如果还找不到，尝试通过index查找
    if (!realGap && gap.index !== undefined && props.segments) {
      const segmentAtIndex = props.segments[gap.index]
      if (segmentAtIndex) {
        realGap = props.gaps.find(g => g.beforeSegmentId === segmentAtIndex.id)
        console.log('TimelineSegments - searching by segment index:', gap.index, 'segmentId:', segmentAtIndex.id, 'found:', realGap)
        if (realGap) {
          console.log('Real gap duration type (by index):', typeof realGap.duration, 'value:', realGap.duration)
        }
      }
    }
  }

  if (realGap) {
    console.log('TimelineSegments - using real gap duration:', realGap.duration)
    console.log('Real gap duration is NaN?', isNaN(realGap.duration))

    // 添加 NaN 检查和修复
    const safeDuration = isNaN(realGap.duration) ? 1 : realGap.duration
    console.log('TimelineSegments - safeDuration after NaN check:', safeDuration)

    // 创建副本而不是直接引用，避免修改原始数据
    currentGap.value = { ...realGap }
    gapDuration.value = safeDuration
  } else {
    console.log('TimelineSegments - real gap not found, using temp gap duration:', gap.duration || 1)

    // 对临时 gap 也进行 NaN 检查
    const tempSafeDuration = isNaN(gap.duration) ? 1 : (gap.duration || 1)
    console.log('TimelineSegments - temp safeDuration after NaN check:', tempSafeDuration)

    // 如果找不到真正的gap，使用传入的gap数据的副本
    currentGap.value = { ...gap }
    gapDuration.value = tempSafeDuration
  }

  console.log('TimelineSegments - final gapDuration set to:', gapDuration.value)
  console.log('TimelineSegments - final gapDuration is NaN?', isNaN(gapDuration.value))
  console.log('=== TimelineSegments - handleGapSelect END ===')

  showGapDialog.value = true
  emit('gap-select', realGap || gap)
}

function formatGapTooltip(value: number): string {
  return `${value}秒`
}

function confirmGapChange() {
  console.log('=== TimelineSegments - confirmGapChange START ===')
  console.log('currentGap.value:', currentGap.value)
  console.log('gapDuration.value:', gapDuration.value)
  console.log('gapDuration.value type:', typeof gapDuration.value)
  console.log('gapDuration.value is NaN?', isNaN(gapDuration.value))

  if (currentGap.value) {
    // 确保 duration 是有效数字
    const safeDuration = isNaN(gapDuration.value) ? 1 : Number(gapDuration.value)
    console.log('safeDuration after conversion:', safeDuration, 'type:', typeof safeDuration)

    console.log('About to emit gap-update with:')
    console.log('  gapId:', currentGap.value.id)
    console.log('  duration:', safeDuration)
    console.log('  Parameters will be passed as:', [currentGap.value.id, safeDuration])

    emit('gap-update', currentGap.value.id, safeDuration)

    console.log('gap-update event emitted successfully')
    ElMessage.success(`间隔已调整为 ${safeDuration} 秒`)
  } else {
    console.log('ERROR: currentGap.value is null/undefined')
  }

  console.log('=== TimelineSegments - confirmGapChange END ===')
  closeGapDialog()
}

function closeGapDialog() {
  console.log('=== TimelineSegments - closeGapDialog START ===')
  console.log('Before close - currentGap.value:', currentGap.value)
  console.log('Before close - gapDuration.value:', gapDuration.value)

  showGapDialog.value = false
  currentGap.value = null
  // 不要重置 gapDuration.value，让它保持上次的值
  // gapDuration.value = 1  // 这行是问题的根源

  console.log('After close - currentGap.value:', currentGap.value)
  console.log('After close - gapDuration.value (not reset):', gapDuration.value)
  console.log('=== TimelineSegments - closeGapDialog END ===')
}

function resetGap() {
  if (currentGap.value) {
    gapDuration.value = 1
    emit('gap-update', currentGap.value.id, 1)
    ElMessage.success('间隔已重置为1秒')
    closeGapDialog()
  }
}

function removeGap() {
  if (currentGap.value) {
    ElMessageBox.confirm(
      '确定要删除这个间隔吗？删除后相邻的句子将直接连接。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      if (currentGap.value) {
        emit('gap-remove', currentGap.value.id)
        closeGapDialog()
      }
    }).catch(() => {
      // 用户取消删除，不做任何操作
    })
  }
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

.gap-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
}

.input-label {
  font-size: 14px;
  color: #e4e7ed;
  white-space: nowrap;
}

.gap-duration-input {
  flex: 1;
  min-width: 120px;
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-left-actions {
  display: flex;
  gap: 10px;
}

.dialog-right-actions {
  display: flex;
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