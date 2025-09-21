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
import { ref, computed, watch, nextTick } from 'vue'
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

  // 强制依赖于gaps的变化，确保计算属性在gaps更新时重新计算
  const gapsData = props.gaps

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
      const gapDuration = getGapDuration(index)
      const nextSegment = props.segments[index + 1]

      // 尝试找到真正的gap对象
      const realGap = gapsData?.find(g => g.beforeSegmentId === segment.id)

      items.push({
        type: 'gap',
        data: {
          id: realGap ? realGap.id : `gap_${segment.id}_${index}`,
          beforeSegmentId: segment.id,
          afterSegmentId: nextSegment?.id,
          index: index,
          duration: gapDuration,
          isSelected: false,
          startTime: 0, // TODO: 计算实际开始时间
          endTime: 0    // TODO: 计算实际结束时间
        },
        index: index
      })
    }
  })
  console.log('TimelineDisplay - timelineItems computed, total items:', items.length)
  return items
})

// 方法
function getGapDuration(index: number) {
  try {
    console.log('TimelineDisplay - getGapDuration called with index:', index)

    if (!props.gaps || !props.segments || !props.segments[index]) {
      console.log('TimelineDisplay - getGapDuration: no gaps or segments, returning default 1')
      return 1
    }

    const currentSegment = props.segments[index]
    console.log('TimelineDisplay - currentSegment:', currentSegment.id)

    const gap = props.gaps.find(g => g.beforeSegmentId === currentSegment?.id)
    console.log('TimelineDisplay - found gap:', gap)

    if (gap) {
      console.log('TimelineDisplay - gap.duration type:', typeof gap.duration, 'value:', gap.duration)
      console.log('TimelineDisplay - gap.duration is NaN?', isNaN(gap.duration))

      // 添加 NaN 检查
      if (isNaN(gap.duration)) {
        console.error('TimelineDisplay - WARNING: gap.duration is NaN, using default 1')
        return 1
      }

      return gap.duration
    } else {
      console.log('TimelineDisplay - no gap found for segment, using default 1')
      return 1
    }
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
  console.log('TimelineDisplay - handleEditFinish:', segmentId, text)

  // 发出编辑完成事件
  emit('edit-segment-finish', segmentId, text)

  // 延迟清空编辑状态，确保数据更新完成
  setTimeout(() => {
    editingSegmentId.value = ''
    editingText.value = ''
    console.log('TimelineDisplay - editing state cleared after timeout')
  }, 100)
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

// 监听gaps变化
watch(() => props.gaps, (newGaps) => {
  try {
    console.log('TimelineDisplay - gaps changed:', newGaps?.length, 'gaps')
    newGaps?.forEach(gap => {
      console.log(`Gap ${gap.id}: ${gap.beforeSegmentId} -> ${gap.afterSegmentId}, duration: ${gap.duration}`)
    })
  } catch (error) {
    console.error('TimelineDisplay - error processing gaps:', error)
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