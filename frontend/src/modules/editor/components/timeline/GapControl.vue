<template>
  <div
    class="gap-control"
    :class="{ active: isActive }"
    @click="$emit('select', gap)"
  >
    <div class="gap-indicator">
      <div class="gap-line"></div>
      <div class="gap-duration">{{ gap.duration }}s</div>
    </div>

    <!-- 间隔调整控件 -->
    <div v-if="isActive" class="gap-settings">
      <el-slider
        :model-value="gap.duration"
        :min="0.1"
        :max="5"
        :step="0.1"
        :format-tooltip="formatTooltip"
        @input="handleDurationChange"
        class="gap-slider"
      />
      <div class="gap-actions">
        <el-button
          @click.stop="$emit('reset-gap', gap.id)"
          size="small"
          type="info"
          class="gap-action-btn"
        >
          重置
        </el-button>
        <el-button
          @click.stop="$emit('remove-gap', gap.id)"
          size="small"
          type="danger"
          class="gap-action-btn"
        >
          移除
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  gap: SegmentGap
  isActive: boolean
}

interface Emits {
  (e: 'select', gap: SegmentGap): void
  (e: 'update-duration', gapId: string, duration: number): void
  (e: 'reset-gap', gapId: string): void
  (e: 'remove-gap', gapId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 方法
function handleDurationChange(value: number) {
  emit('update-duration', props.gap.id, value)
}

function formatTooltip(value: number): string {
  return `${value}s`
}
</script>

<style scoped>
.gap-control {
  position: relative;
  width: 60px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 3;
}

.gap-control:hover {
  background: rgba(64, 158, 255, 0.1);
}

.gap-control.active {
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid #409eff;
  border-radius: 4px;
}

.gap-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gap-line {
  width: 2px;
  height: 30px;
  background: #67c23a;
  border-radius: 1px;
}

.gap-duration {
  color: #67c23a;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: #2a2a2a;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid #67c23a;
}

/* 间隔设置面板 */
.gap-settings {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #555;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  z-index: 1000;
}

.gap-slider {
  margin-bottom: 12px;
}

.gap-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.gap-action-btn {
  font-size: 12px;
  padding: 4px 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gap-control {
    width: 50px;
  }

  .gap-settings {
    min-width: 180px;
  }
}
</style>