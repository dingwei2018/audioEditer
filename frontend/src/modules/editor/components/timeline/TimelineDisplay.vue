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
            @add-after="handleAddAfterClick"
            @delete="$emit('delete-segment', item.data.id)"
          />

          <!-- 句子间的间隔控制 -->
          <GapControl
            v-else-if="item.type === 'gap'"
            :gap="item.data"
            :is-active="selectedGapId === item.data.id"
            @select="handleGapSelect"
          />

          <!-- 添加间隔按钮 -->
          <button
            v-else-if="item.type === 'add-gap'"
            class="add-gap-control plus-btn"
            @click.stop.prevent="handleAddGapClick(item.data.beforeSegmentId, item.data.afterSegmentId)"
            type="button"
            title="添加间隔"
          >
            <svg class="plus-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
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
  (e: 'add-sentence-after', segmentId: string, index: number): void
  (e: 'add-gap', beforeSegmentId: string, afterSegmentId: string): void
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

  // 打印输入的segments
  // props.segments.forEach((segment, index) => {
  // })

  // 打印输入的gaps
  // if (props.gaps) {
  //   props.gaps.forEach((gap, index) => {
  //   })
  // }

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

    // 检查是否存在真正的gap数据，只有存在时才添加间隔
    if (index < props.segments.length - 1) {
      const nextSegment = props.segments[index + 1]

      // 尝试找到真正的gap对象
      const realGap = gapsData?.find(g => g.beforeSegmentId === segment.id)

      // 只有当确实存在gap数据时才显示间隔
      if (realGap && realGap.duration > 0) {

        items.push({
          type: 'gap',
          data: {
            id: realGap.id,
            beforeSegmentId: segment.id,
            afterSegmentId: nextSegment?.id,
            index: index,
            duration: realGap.duration,
            isSelected: realGap.isSelected || false,
            startTime: 0, // TODO: 计算实际开始时间
            endTime: 0    // TODO: 计算实际结束时间
          },
          index: index
        })
      } else {
        // if (realGap) {
        // } else {
        // }

        // 在没有间隔时，添加一个"添加间隔"控件
        items.push({
          type: 'add-gap',
          data: {
            id: `add-gap-${segment.id}-${nextSegment?.id}`,
            beforeSegmentId: segment.id,
            afterSegmentId: nextSegment?.id,
            index: index
          },
          index: index
        })
      }
    }
  })

  // items.forEach((item, idx) => {
  //   if (item.type === 'segment') {
  //   } else if (item.type === 'gap') {
  //   } else if (item.type === 'add-gap') {
  //   }
  // })

  return items
})

// 方法
function getGapDuration(index: number) {
  try {

    if (!props.gaps || !props.segments || !props.segments[index]) {
      return 1
    }

    const currentSegment = props.segments[index]

    const gap = props.gaps.find(g => g.beforeSegmentId === currentSegment?.id)

    if (gap) {

      // 添加 NaN 检查
      if (isNaN(gap.duration)) {
        console.error('TimelineDisplay - WARNING: gap.duration is NaN, using default 1')
        return 1
      }

      return gap.duration
    } else {
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

  // 发出编辑完成事件
  emit('edit-segment-finish', segmentId, text)

  // 延迟清空编辑状态，确保数据更新完成
  setTimeout(() => {
    editingSegmentId.value = ''
    editingText.value = ''
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

function handleAddAfterClick(segmentId: string, index: number) {

  // 找到这个segment在props.segments中的实际位置
  const actualIndex = props.segments?.findIndex(seg => seg.id === segmentId) ?? -1

  // 检查传入的index和实际index是否匹配
  if (actualIndex !== index) {
    console.warn('WARNING: index mismatch! Passed index:', index, 'Actual index:', actualIndex)
  }

  emit('add-sentence-after', segmentId, actualIndex)
}

function handleAddGapClick(beforeSegmentId: string, afterSegmentId: string) {

  emit('add-gap', beforeSegmentId, afterSegmentId)
}

// 监听segments变化
watch(() => props.segments, (newSegments) => {
  try {
  } catch (error) {
    console.error('TimelineDisplay - error processing segments:', error)
  }
}, { immediate: true, deep: true })

// 监听gaps变化
watch(() => props.gaps, (newGaps) => {
  try {
    newGaps?.forEach(gap => {
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
  
  .add-gap-control.plus-btn {
    width: 28px;
    height: 28px;
  }
  
  .add-gap-control.plus-btn .plus-icon {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .add-gap-control.plus-btn {
    width: 24px;
    height: 24px;
  }
  
  .add-gap-control.plus-btn .plus-icon {
    font-size: 14px;
  }
}

/* 添加间隔控件样式 */
.add-gap-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  z-index: 999 !important;
  cursor: pointer;
  pointer-events: all !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* +号按钮样式 */
.add-gap-control.plus-btn {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-gap-control.plus-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.add-gap-control.plus-btn:hover::before {
  left: 100%;
}

.add-gap-control.plus-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.add-gap-control.plus-btn:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.add-gap-control.plus-btn .plus-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

</style>