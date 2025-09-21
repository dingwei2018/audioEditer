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
          <div class="preset-buttons">
            <button
              v-for="preset in gapPresets"
              :key="preset"
              @click="gapDuration = preset"
              class="preset-btn"
              :class="{ active: gapDuration === preset }"
            >
              {{ preset }}s
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="dialog-left-actions">
            <button @click="resetGap" class="action-btn reset-btn">重置为1秒</button>
            <button @click="removeGap" class="action-btn delete-btn">删除间隔</button>
          </div>
          <div class="dialog-right-actions">
            <button @click="confirmGapChange" class="action-btn confirm-btn">确认</button>
            <button @click="closeGapDialog" class="action-btn cancel-btn">取消</button>
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
}

function handleEditFinish(segmentId: string, text: string) {

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
  // 取消编辑，不做任何操作
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

  // 先清理所有 NaN 数据（临时修复方案）
  // TODO: 这个应该在应用启动时调用，这里是紧急修复
  if (props.gaps && props.gaps.some(g => isNaN(g.duration))) {
    props.gaps.forEach((g, index) => {
      if (isNaN(g.duration)) {
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
      if (realGap) {
      }
    }

    // 如果通过beforeSegmentId找不到，尝试通过ID直接查找
    if (!realGap && gap.id) {
      realGap = props.gaps.find(g => g.id === gap.id)
      if (realGap) {
      }
    }

    // 如果还找不到，尝试通过index查找
    if (!realGap && gap.index !== undefined && props.segments) {
      const segmentAtIndex = props.segments[gap.index]
      if (segmentAtIndex) {
        realGap = props.gaps.find(g => g.beforeSegmentId === segmentAtIndex.id)
        if (realGap) {
        }
      }
    }
  }

  if (realGap) {

    // 添加 NaN 检查和修复
    const safeDuration = isNaN(realGap.duration) ? 1 : realGap.duration

    // 创建副本而不是直接引用，避免修改原始数据
    currentGap.value = { ...realGap }
    gapDuration.value = safeDuration
  } else {

    // 对临时 gap 也进行 NaN 检查
    const tempSafeDuration = isNaN(gap.duration) ? 1 : (gap.duration || 1)

    // 如果找不到真正的gap，使用传入的gap数据的副本
    currentGap.value = { ...gap }
    gapDuration.value = tempSafeDuration
  }


  showGapDialog.value = true
  emit('gap-select', realGap || gap)
}

function formatGapTooltip(value: number): string {
  return `${value}秒`
}

function confirmGapChange() {

  if (currentGap.value) {
    // 确保 duration 是有效数字
    const safeDuration = isNaN(gapDuration.value) ? 1 : Number(gapDuration.value)


    emit('gap-update', currentGap.value.id, safeDuration)

    ElMessage.success(`间隔已调整为 ${safeDuration} 秒`)
  } else {
  }

  closeGapDialog()
}

function closeGapDialog() {

  showGapDialog.value = false
  currentGap.value = null
  // 不要重置 gapDuration.value，让它保持上次的值
  // gapDuration.value = 1  // 这行是问题的根源

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
  background: #ffffff;
  color: #333333;
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.gap-setting-dialog .el-dialog__header) {
  background: #ffffff;
  color: #333333;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.gap-setting-dialog .el-dialog__body) {
  background: #ffffff;
  padding: 20px;
  color: #333333;
}

:deep(.gap-setting-dialog .el-dialog__footer) {
  background: #ffffff;
  border-top: 1px solid #e4e7ed;
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

.preset-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  min-width: 40px;
}

.preset-btn:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.preset-btn.active {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  transform: scale(1.05);
}

.preset-btn.active:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
}

/* 对话框底部按钮样式 */
.action-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 80px;
}

.confirm-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

.cancel-btn {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.cancel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
}

.reset-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.reset-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
}

.delete-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
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