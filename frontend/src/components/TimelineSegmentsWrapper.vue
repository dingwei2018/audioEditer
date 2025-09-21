<template>
  <div class="timeline-segments-wrapper">
    <!-- 使用新的模块化时间轴组件 -->
    <TimelineSegments
      :segments="segments"
      :gaps="gaps"
      :selected-segment-id="selectedSegmentId"
      :playing-segment-id="playingSegmentId"
      :selected-gap-id="selectedGapId"
      @segment-select="handleSegmentSelect"
      @segment-edit="$emit('segment-edit', $event)"
      @segment-delete="$emit('segment-delete', $event)"
      @segment-add-after="$emit('segment-add-after', $event)"
      @gap-select="$emit('gap-select', $event)"
      @gap-update="handleGapUpdate"
      @gap-remove="$emit('gap-remove', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import TimelineSegments from '@/modules/editor/components/timeline/TimelineSegments.vue'
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
  (e: 'gap-add', beforeSegmentId: string, afterSegmentId: string): void
  (e: 'gap-select', gap: SegmentGap): void
  (e: 'gap-update', gapId: string, duration: number): void
  (e: 'gap-remove', gapId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理句子选择
function handleSegmentSelect(segment: SegmentWithTiming) {
  emit('segment-select', segment)
}

// 处理gap更新，确保正确传递多个参数
function handleGapUpdate(gapId: string, duration: number) {
  emit('gap-update', gapId, duration)
}
</script>

<script lang="ts">
export default {
  name: 'TimelineSegments'
}
</script>

<style scoped>
.timeline-segments-wrapper {
  width: 100%;
  height: 100%;
}
</style>