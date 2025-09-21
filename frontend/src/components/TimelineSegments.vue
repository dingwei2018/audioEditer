<template>
  <div class="timeline-segments-wrapper">
    <!-- 使用新的模块化时间轴组件 -->
    <ModularTimelineSegments
      :segments="segments"
      :gaps="gaps"
      :selected-segment-id="selectedSegmentId"
      :playing-segment-id="playingSegmentId"
      :selected-gap-id="selectedGapId"
      @segment-select="$emit('segment-select', $event)"
      @segment-edit="$emit('segment-edit', $event)"
      @segment-delete="$emit('segment-delete', $event)"
      @segment-add-after="$emit('segment-add-after', $event)"
      @audio-synthesize="$emit('audio-synthesize', $event)"
      @audio-play="$emit('audio-play', $event)"
      @gap-select="$emit('gap-select', $event)"
      @gap-update="handleGapUpdate"
      @gap-remove="$emit('gap-remove', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import ModularTimelineSegments from '@/modules/editor/components/timeline/TimelineSegments.vue'
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

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理gap更新，确保正确传递多个参数
function handleGapUpdate(gapId: string, duration: number) {
  console.log('Wrapper TimelineSegments - handleGapUpdate:', gapId, duration)
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