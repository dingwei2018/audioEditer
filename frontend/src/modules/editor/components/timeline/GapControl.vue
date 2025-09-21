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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
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

/* 响应式设计 */
@media (max-width: 768px) {
  .gap-control {
    width: 50px;
  }
}
</style>