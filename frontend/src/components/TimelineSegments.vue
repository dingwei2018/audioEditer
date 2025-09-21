<template>
  <div class="timeline-segments">
    <!-- 提示文字 -->
    <!-- <div class="hint-text">
      提示：点击选中句子，在下方可编辑相关语音配置；点击句子间的间隔可以调整间隔时间
    </div> -->
    
    <!-- 句子时间轴 -->
    <div class="sentences-timeline" ref="timelineContainer">
      <div class="timeline-content" :style="{ width: `${timelineWidth}px` }">
        <div class="timeline-line"></div>
        
        <!-- 时间轴项目显示 -->
        <div 
          v-for="item in timelineItems" 
          :key="item.type === 'segment' ? item.data.id : item.data.id"
        >
          <!-- 句子块 -->
          <div 
            v-if="item.type === 'segment'"
            class="sentence-block"
            :class="{ 
              active: props.selectedSegmentId === item.data.id,
              playing: props.playingSegmentId === item.data.id,
              editing: editingSegmentId === item.data.id
            }"
            @click="selectSegment(item.data)"
            @dblclick="startEditSegment(item.data)"
          >
            <div class="sentence-content">
              <!-- 编辑模式 -->
              <div v-if="editingSegmentId === item.data.id" class="sentence-edit">
                <el-input
                  v-model="editingText"
                  type="textarea"
                  :rows="2"
                  size="small"
                  placeholder="输入句子内容..."
                  @blur="finishEditSegment"
                  @keydown.enter.prevent="finishEditSegment"
                  @keydown.escape="cancelEditSegment"
                  ref="editInput"
                  class="sentence-edit-input"
                />
              </div>
              <!-- 显示模式 -->
              <div v-else>
                <div class="sentence-text">{{ item.data.text }}</div>
                <div class="sentence-info">
                  <span class="sentence-duration">{{ item.data.duration }}s</span>
                  <span class="sentence-index">#{{ item.index + 1 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="props.selectedSegmentId === item.data.id && editingSegmentId !== item.data.id" class="sentence-actions">
              <el-button
                @click.stop="synthesizeAudio(item.data)"
                type="success"
                size="small"
                icon="Microphone"
                circle
                class="action-btn synthesize-btn"
                title="合成音频"
              />
              <el-button
                @click.stop="playAudio(item.data)"
                type="info"
                size="small"
                icon="VideoPlay"
                circle
                class="action-btn play-btn"
                title="播放音频"
                :disabled="!item.data.audioUrl"
              />
              <el-button
                @click.stop="addSentenceAfter(item.index)"
                type="primary"
                size="small"
                icon="Plus"
                circle
                class="action-btn add-btn"
                title="在此句后添加新句子"
              />
              <el-button
                @click.stop="deleteSentence(item.data.id)"
                type="danger"
                size="small"
                icon="Delete"
                circle
                class="action-btn delete-btn"
                title="删除此句子"
              />
            </div>
          </div>
          
          <!-- 句子间的间隔控制 -->
          <div 
            v-else-if="item.type === 'gap'"
            class="gap-control-block"
            :class="{ active: selectedGapId === `gap_${item.index}` }"
            @click="selectGapBetween(item.index)"
          >
            <div class="gap-indicator">
              <div class="gap-line"></div>
              <div class="gap-duration">{{ item.data.duration }}s</div>
            </div>
          </div>
        </div>
        
        <!-- 时间轴结束标记 -->
        <div class="timeline-end" :style="{ left: `${timelineWidth - 50}px` }">
          <div class="end-line"></div>
        </div>
      </div>
    </div>
    
    <!-- 间隔设置弹框 -->
    <el-dialog
      v-model="showGapDialog"
      title="设置间隔时间"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="gap-dialog-content">
        <div class="gap-info">
          <p>当前间隔位置：第 {{ currentGapIndex + 1 }} 个句子后</p>
        </div>
        
        <div class="gap-duration-setting">
          <label class="duration-label">间隔时长：</label>
          <div class="duration-control">
            <el-slider
              v-model="gapDuration"
              :min="0.1"
              :max="5"
              :step="0.1"
              :format-tooltip="(val) => `${val}秒`"
              show-input
              class="duration-slider"
            />
          </div>
        </div>
        
        <div class="gap-preview">
          <p>预览：间隔 {{ gapDuration }} 秒</p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelGapDuration">取消</el-button>
          <el-button type="primary" @click="confirmGapDuration">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { TextSegment } from '../utils/textSegmentation'

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
  tracks?: any[] // 添加轨道数据
}

interface Emits {
  (e: 'select-segment', segment: SegmentWithTiming): void
  (e: 'play-segment', segmentId: string): void
  (e: 'edit-segment', segmentId: string): void
  (e: 'add-text', position: number): void
  (e: 'update-segment-text', segmentId: string, newText: string): void
  (e: 'delete-segment', segmentId: string): void
  (e: 'add-sentence-after', segmentId: string, index: number): void
  (e: 'select-gap', gap: SegmentGap): void
  (e: 'update-gap-duration', gapId: string, duration: number): void
  (e: 'remove-gap', gapId: string): void
  (e: 'open-voice-editor', segment: SegmentWithTiming): void
  (e: 'synthesize-audio', segment: SegmentWithTiming): void
  (e: 'play-audio', segment: SegmentWithTiming): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const selectedSegment = ref<SegmentWithTiming | null>(null)
const selectedSegmentIndex = ref<number>(-1)
const playingSegmentId = ref<string>('')
const timelineContainer = ref<HTMLElement>()

// 间隔相关数据
const selectedGapId = ref<string>('')
const selectedGap = ref<any>(null)

// 间隔设置弹框
const showGapDialog = ref(false)
const gapDuration = ref(1)
const currentGapIndex = ref(-1)

// 编辑相关数据
const editingSegmentId = ref<string>('')
const editingText = ref<string>('')
const editInput = ref<any>(null)

// 间隔控制数据

// 时间轴配置
const PIXELS_PER_SECOND = 100 // 每秒100像素，增加显示密度

// 计算属性
const totalDuration = computed(() => props.totalDuration)

const timelineWidth = computed(() => {
  const baseWidth = totalDuration.value * PIXELS_PER_SECOND
  return Math.max(baseWidth, 1200) // 最小宽度1200px
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

// 监听props变化
watch(() => props.playingSegmentId, (newId) => {
  playingSegmentId.value = newId || ''
})

// 监听segments变化
watch(() => props.segments, (newSegments) => {
  try {
    console.log('TimelineSegments - segments changed:', newSegments.length, 'segments')
    if (newSegments && newSegments.length > 0) {
      console.log('TimelineSegments - first segment:', newSegments[0])
    }
  } catch (error) {
    console.error('TimelineSegments - error processing segments:', error)
  }
}, { immediate: true, deep: true })

// 监听选中句子的变化，如果句子内容为空则自动进入编辑模式
watch(() => props.selectedSegmentId, (newSelectedId) => {
  if (newSelectedId && props.segments) {
    const segment = props.segments.find(s => s.id === newSelectedId)
    if (segment && (!segment.text || segment.text.trim() === '')) {
      // 如果选中的句子内容为空，自动进入编辑模式
      startEditSegment(segment)
    }
  }
}, { immediate: false })

// 不再需要监听窗口大小变化，使用CSS控制宽度

// 方法

const getVoiceLabel = (voice?: string) => {
  const labels = {
    zhichu: '知初',
    zhimei: '知美',
    zhiwen: '知文'
  }
  return labels[voice as keyof typeof labels] || '知初'
}

const selectSegment = (segment: SegmentWithTiming) => {
  selectedSegment.value = segment
  selectedSegmentIndex.value = props.segments.findIndex(s => s.id === segment.id)
  emit('select-segment', segment)
  // 选中句子时直接触发语音编辑
  emit('open-voice-editor', segment)
}

const playSegment = (segmentId: string) => {
  emit('play-segment', segmentId)
}

const editSegment = (segmentId: string) => {
  emit('edit-segment', segmentId)
}

// 合成音频
const synthesizeAudio = (segment: SegmentWithTiming) => {
  emit('synthesize-audio', segment)
}

// 播放音频
const playAudio = (segment: SegmentWithTiming) => {
  if (segment.audioUrl) {
    emit('play-audio', segment)
  } else {
    ElMessage.warning('该句子还没有合成音频')
  }
}

const addTextAtPosition = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const position = (event.clientX - rect.left) / PIXELS_PER_SECOND
  emit('add-text', position)
}

// 编辑相关方法
const startEditSegment = (segment: SegmentWithTiming) => {
  editingSegmentId.value = segment.id
  editingText.value = segment.text
  
  // 延迟聚焦，确保DOM已更新
  setTimeout(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  }, 50)
}

const finishEditSegment = () => {
  if (editingSegmentId.value) {
    const trimmedText = editingText.value.trim()
    
    if (trimmedText === '') {
      // 如果内容为空，删除句子
      emit('delete-segment', editingSegmentId.value)
      // 清除选中状态
      selectedSegment.value = null
      selectedSegmentIndex.value = -1
    } else {
      // 更新句子内容
      emit('update-segment-text', editingSegmentId.value, trimmedText)
    }
    
    // 退出编辑模式
    editingSegmentId.value = ''
    editingText.value = ''
  }
}

const cancelEditSegment = () => {
  // 取消编辑，恢复原内容
  editingSegmentId.value = ''
  editingText.value = ''
}

// 间隔相关方法
const getGapBlockStyle = (gap: SegmentGap, index: number) => {
  const left = gap.startTime * PIXELS_PER_SECOND + 20 // 起始偏移
  const width = Math.min(gap.duration * PIXELS_PER_SECOND, 100) // 最大100px
  
  return {
    left: `${left}px`,
    width: `${width}px`,
    top: '90px', // 在句子下方显示
    height: '20px'
  }
}

const selectGap = (gap: SegmentGap) => {
  selectedGapId.value = gap.id
  selectedGap.value = gap
  // 清除句子选中状态
  selectedSegment.value = null
  selectedSegmentIndex.value = -1
  emit('select-gap', gap)
}

const updateGapDuration = () => {
  if (selectedGap.value) {
    emit('update-gap-duration', selectedGap.value.id, selectedGap.value.duration)
  }
}

const removeGap = (gapId: string) => {
  emit('remove-gap', gapId)
  // 清除选中状态
  selectedGapId.value = ''
  selectedGap.value = null
}

// 间隔控制方法
const selectGapBetween = (index: number) => {
  const gapId = `gap_${index}`
  selectedGapId.value = gapId
  // 清除句子选中状态
  selectedSegment.value = null
  selectedSegmentIndex.value = -1
  
  // 创建或获取间隔数据
  const gap = {
    id: gapId,
    index: index,
    duration: getGapDuration(index)
  }
  selectedGap.value = gap
  
  // 打开间隔设置弹框
  currentGapIndex.value = index
  gapDuration.value = getGapDuration(index)
  showGapDialog.value = true
}

const getGapDuration = (index: number) => {
  try {
    // 从gaps数组中获取对应间隔的时长，如果没有则返回默认值
    if (!props.gaps || !props.segments || !props.segments[index]) {
      return 1 // 默认1秒间隔
    }
    const gap = props.gaps.find(g => g.beforeSegmentId === props.segments[index]?.id)
    return gap ? gap.duration : 1 // 默认1秒间隔
  } catch (error) {
    console.error('TimelineSegments - error in getGapDuration:', error)
    return 1 // 默认1秒间隔
  }
}

// 间隔设置弹框方法
const confirmGapDuration = () => {
  if (currentGapIndex.value >= 0) {
    // 触发更新间隔时长事件
    emit('update-gap-duration', `gap_${currentGapIndex.value}`, gapDuration.value)
  }
  showGapDialog.value = false
}

const cancelGapDuration = () => {
  showGapDialog.value = false
}

// 句子操作方法
const addSentenceAfter = (index: number) => {
  const currentSegment = props.segments[index]
  if (currentSegment) {
    // 触发添加句子事件，传递位置信息
    emit('add-sentence-after', currentSegment.id, index)
  }
}

const deleteSentence = (segmentId: string) => {
  // 触发删除句子事件
  emit('delete-segment', segmentId)
}

</script>

<script lang="ts">
export default {
  name: 'TimelineSegments'
}
</script>

<style scoped>
.timeline-segments {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

/* 提示文字 */
.hint-text {
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: #cccccc;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
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

.sentence-block {
  position: relative;
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 80vw;
  width: max-content;
  height: auto;
  min-height: 60px;
  flex-shrink: 0;
  z-index: 2;
}

.sentence-block:hover {
  border-color: #409eff;
  background: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.sentence-block.active {
  border-color: #409eff;
  background: #1e3a5f;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.sentence-block.playing {
  border-color: #67c23a;
  background: #1e3a5f;
  animation: pulse 1.5s ease-in-out infinite;
}

.sentence-block.editing {
  border-color: #e6a23c;
  background: #2d2a1f;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

/* 句子操作按钮 */
.sentence-actions {
  position: absolute;
  top: -15px;
  right: -15px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.add-btn {
  background: #67c23a;
  border-color: #67c23a;
}

.add-btn:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.delete-btn {
  background: #f56c6c;
  border-color: #f56c6c;
}

.delete-btn:hover {
  background: #f78989;
  border-color: #f78989;
}

.synthesize-btn {
  background: #67c23a;
  border-color: #67c23a;
}

.synthesize-btn:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.play-btn {
  background: #409eff;
  border-color: #409eff;
}

.play-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.play-btn:disabled {
  background: #c0c4cc;
  border-color: #c0c4cc;
  cursor: not-allowed;
}

.play-btn:disabled:hover {
  background: #c0c4cc;
  border-color: #c0c4cc;
  transform: none;
}

/* 间隔控制块 */
.gap-control-block {
  position: relative;
  width: 40px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.gap-control-block:hover {
  transform: scale(1.1);
}

.gap-control-block.active {
  transform: scale(1.2);
}

.gap-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gap-line {
  width: 2px;
  height: 20px;
  background: #f56c6c;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.gap-control-block:hover .gap-line {
  background: #ff7875;
  height: 30px;
}

.gap-control-block.active .gap-line {
  background: #ff4d4f;
  height: 40px;
  width: 3px;
}

.gap-duration {
  color: #f56c6c;
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(103, 194, 58, 0.5);
  }
}

.sentence-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;
}

.sentence-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多显示两行 */
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
}

.sentence-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 4px;
}

.sentence-duration {
  color: #67c23a;
  font-weight: 500;
  white-space: nowrap;
}

.sentence-index {
  color: #909399;
  background: #444;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 编辑模式样式 */
.sentence-edit {
  width: 100%;
}

.sentence-edit-input {
  width: 100%;
}

.sentence-edit-input :deep(.el-textarea__inner) {
  background: #1a1a1a;
  border: 1px solid #e6a23c;
  color: white;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
}

.sentence-edit-input :deep(.el-textarea__inner):focus {
  border-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

/* 间隔样式 */
.gap-block {
  position: absolute;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.gap-block:hover {
  border-color: #f56c6c;
  background: #4a3a3a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.gap-block.active {
  border-color: #f56c6c;
  background: #4a3a3a;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.gap-block.selected {
  border-color: #f56c6c;
  background: #4a3a3a;
  animation: gapPulse 1.5s ease-in-out infinite;
}

@keyframes gapPulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  }
  50% {
    box-shadow: 0 2px 12px rgba(245, 108, 108, 0.5);
  }
}

.gap-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 2px;
}

.gap-duration {
  color: #f56c6c;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.gap-label {
  color: #909399;
  font-size: 8px;
  line-height: 1;
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


/* 间隔设置弹框样式 */
.gap-dialog-content {
  padding: 20px 0;
}

.gap-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.gap-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.gap-duration-setting {
  margin-bottom: 20px;
}

.duration-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.duration-control {
  padding: 0 10px;
}

.duration-slider {
  margin: 10px 0;
}

.gap-preview {
  padding: 12px;
  background: #e8f4fd;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.gap-preview p {
  margin: 0;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sentences-timeline {
    height: 100px;
  }
  
  .sentence-box {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .segment-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .gap-dialog-content {
    padding: 15px 0;
  }
  
  .gap-info,
  .gap-preview {
    padding: 10px;
  }
}
</style>
