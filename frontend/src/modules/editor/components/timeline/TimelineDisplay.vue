<template>
  <div class="timeline-display">
    <div class="sentences-timeline" ref="timelineContainer">
      <div class="timeline-content" :style="{ width: `${timelineWidth}px` }">
        <div class="timeline-line"></div>

        <!-- 时间轴项目显示 -->
        <div
          v-for="item in timelineItems"
          :key="item.type === 'segment' ? item.data.id : item.data.id"
        >
          <!-- 句子块 -->
          <SentenceBlock
            v-if="item.type === 'segment'"
            :segment="item.data"
            :index="item.index"
            :is-selected="selectedSegmentId === item.data.id"
            :is-playing="playingSegmentId === item.data.id"
            :is-editing="editingSegmentId === item.data.id"
            :editing-text="editingText"
            @select="$emit('select-segment', item.data)"
            @edit-start="handleEditStart"
            @edit-finish="handleEditFinish"
            @edit-cancel="handleEditCancel"
            @synthesize="$emit('synthesize-audio', item.data)"
            @play="$emit('play-audio', item.data)"
            @add-after="$emit('add-sentence-after', item.data.id, item.index)"
            @delete="$emit('delete-segment', item.data.id)"
          />

          <!-- 句子间的间隔控制 -->
          <GapControl
            v-else-if="item.type === 'gap'"
            :gap="item.data"
            :is-active="selectedGapId === item.data.id"
            @select="handleGapSelect"
          />
        </div>

        <!-- 时间轴结束标记 -->
        <div class="timeline-end" :style="{ left: `${timelineWidth - 50}px` }">
          <div class="end-line"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SentenceBlock from './SentenceBlock.vue'
import GapControl from './GapControl.vue'
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
  gaps: SegmentGap[]
  totalDuration: number
  selectedSegmentId?: string
  playingSegmentId?: string
  selectedGapId?: string
}

interface Emits {
  (e: 'select-segment', segment: SegmentWithTiming): void
  (e: 'edit-segment-start', segmentId: string, text: string): void
  (e: 'edit-segment-finish', segmentId: string, text: string): void
  (e: 'edit-segment-cancel', segmentId: string): void
  (e: 'synthesize-audio', segment: SegmentWithTiming): void
  (e: 'play-audio', segment: SegmentWithTiming): void
  (e: 'add-sentence-after', segmentId: string, index: number): void
  (e: 'delete-segment', segmentId: string): void
  (e: 'select-gap', gap: SegmentGap): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const timelineContainer = ref<HTMLElement>()
const editingSegmentId = ref<string>('')
const editingText = ref<string>('')

// 时间轴配置
const PIXELS_PER_SECOND = 100

// 计算属性
const timelineWidth = computed(() => {
  const baseWidth = props.totalDuration * PIXELS_PER_SECOND
  return Math.max(baseWidth, 1200)
})

// 生成包含句子和间隔的时间轴项目
const timelineItems = computed(() => {
  const items = []
  if (!props.segments || !Array.isArray(props.segments)) {
    return items
  }

  props.segments.forEach((segment, index) => {
    if (!segment || !segment.id) {
      return
    }

    // 添加句子
    items.push({
      type: 'segment',
      data: segment,
      index: index
    })

    // 如果不是最后一个句子，添加间隔
    if (index < props.segments.length - 1) {
      items.push({
        type: 'gap',
        data: {
          id: `gap_${segment.id}_${index}`,
          index: index,
          duration: getGapDuration(index)
        },
        index: index
      })
    }
  })
  return items
})

// 方法
function getGapDuration(index: number) {
  try {
    if (!props.gaps || !props.segments || !props.segments[index]) {
      return 1
    }
    const gap = props.gaps.find(g => g.beforeSegmentId === props.segments[index]?.id)
    return gap ? gap.duration : 1
  } catch (error) {
    console.error('TimelineDisplay - error in getGapDuration:', error)
    return 1
  }
}

function handleEditStart(segmentId: string, text: string) {
  editingSegmentId.value = segmentId
  editingText.value = text
  emit('edit-segment-start', segmentId, text)
}

function handleEditFinish(segmentId: string, text: string) {
  editingSegmentId.value = ''
  editingText.value = ''
  emit('edit-segment-finish', segmentId, text)
}

function handleEditCancel(segmentId: string) {
  editingSegmentId.value = ''
  editingText.value = ''
  emit('edit-segment-cancel', segmentId)
}

function handleGapSelect(gap: any) {
  emit('select-gap', gap)
}

// 监听segments变化
watch(() => props.segments, (newSegments) => {
  try {
    console.log('TimelineDisplay - segments changed:', newSegments?.length, 'segments')
  } catch (error) {
    console.error('TimelineDisplay - error processing segments:', error)
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.timeline-display {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

/* 句子时间轴 */
.sentences-timeline {
  height: 120px;
  background: #1a1a1a;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid #333;
}

/* 自定义滚动条样式 */
.sentences-timeline::-webkit-scrollbar {
  height: 8px;
}

.sentences-timeline::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 4px;
}

.sentences-timeline::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.sentences-timeline::-webkit-scrollbar-thumb:hover {
  background: #777;
}

.sentences-timeline::-webkit-scrollbar-thumb:active {
  background: #999;
}

/* Firefox 滚动条样式 */
.sentences-timeline {
  scrollbar-width: thin;
  scrollbar-color: #555 #2a2a2a;
}

.timeline-content {
  position: relative;
  height: 100%;
  min-width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 20px;
  box-sizing: border-box;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: white;
  transform: translateY(-50%);
  z-index: 1;
}

.timeline-end {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.end-line {
  width: 4px;
  height: 20px;
  background: white;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sentences-timeline {
    height: 100px;
  }
}
</style>