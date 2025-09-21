<template>
  <div class="content-display-area">
    <div class="content-header">
      <div class="content-info">
        <span class="sentence-index">句子 #{{ sentenceIndex + 1 }}</span>
        <span class="sentence-duration">{{ sentenceDuration }}s</span>
      </div>
      <div class="content-actions">
        <button
          @click="handleSynthesizeAudio"
          class="action-btn synthesize-btn"
          title="生成音频"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <button
          @click="handlePlayAudio"
          class="action-btn play-btn"
          :disabled="!currentSegment?.audioUrl"
          title="播放音频"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="content-text" ref="contentTextRef">
      <span
        v-for="(char, index) in displayText"
        :key="index"
        :class="getCharClass(index)"
        :data-pause-duration="getPauseDuration(index)"
        @click="selectChar(index)"
        @mouseenter="hoverChar(index)"
        @mouseleave="unhoverChar(index)"
      >
        {{ char }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface PauseMark {
  charIndex: number
  duration: number
}

interface PronunciationMark {
  charIndex: number
  pinyin: string
}

interface SegmentWithTiming {
  id: string
  text: string
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

interface Props {
  sentenceText: string
  sentenceIndex: number
  sentenceDuration: number
  selectedCharIndex: number | null
  hoveredCharIndex: number | null
  pauseMarks: PauseMark[]
  pronunciationMarks: PronunciationMark[]
  currentSegment: SegmentWithTiming | null
}

interface Emits {
  (e: 'char-select', index: number): void
  (e: 'char-hover', index: number): void
  (e: 'char-unhover', index: number): void
  (e: 'synthesize-audio', segment: SegmentWithTiming): void
  (e: 'play-audio', segment: SegmentWithTiming): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contentTextRef = ref<HTMLElement>()

// 计算属性
const displayText = computed(() => {
  return splitTextByWords(props.sentenceText)
})

// 监听props变化
watch(() => props.sentenceText, (newSentenceText) => {
  console.log('SentenceContentDisplay - sentenceText changed:', newSentenceText)
  console.log('SentenceContentDisplay - displayText will be:', splitTextByWords(newSentenceText))
}, { deep: true })

watch(() => props.pauseMarks, (newPauseMarks) => {
  console.log('SentenceContentDisplay - pauseMarks changed:', newPauseMarks)
}, { deep: true })

watch(() => props.pronunciationMarks, (newPronunciationMarks) => {
  console.log('SentenceContentDisplay - pronunciationMarks changed:', newPronunciationMarks)
}, { deep: true })

// 按单词分割文本的函数
function splitTextByWords(text: string): string[] {
  const result: string[] = []
  let currentWord = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    // 判断是否为英文字母或数字
    if (/[a-zA-Z0-9]/.test(char)) {
      currentWord += char
    } else {
      // 如果当前有英文单词，先添加单词
      if (currentWord) {
        result.push(currentWord)
        currentWord = ''
      }
      // 添加非英文字符
      result.push(char)
    }
  }

  // 处理最后一个单词
  if (currentWord) {
    result.push(currentWord)
  }

  return result
}

function getCharClass(index: number): string {
  const classes = ['char']
  const item = displayText.value[index]

  // 判断是否为英文单词
  if (/^[a-zA-Z0-9]+$/.test(item)) {
    classes.push('word')
  }

  if (index === props.selectedCharIndex) {
    classes.push('selected')
  }

  if (index === props.hoveredCharIndex) {
    classes.push('hovered')
  }

  // 检查是否有停顿标记
  const hasPause = props.pauseMarks.some(p => p.charIndex === index)
  if (hasPause) {
    classes.push('has-pause')
  }

  // 检查是否有发音标记
  const hasPronunciation = props.pronunciationMarks.some(p => p.charIndex === index)
  if (hasPronunciation) {
    classes.push('has-pronunciation')
  }

  // 检查前一个字符是否有停顿标记，如果有则增加间距
  const prevCharHasPause = index > 0 && props.pauseMarks.some(p => p.charIndex === index - 1)
  if (prevCharHasPause) {
    classes.push('after-pause')
  }

  return classes.join(' ')
}

function getPauseDuration(index: number): string {
  const pauseMark = props.pauseMarks.find(p => p.charIndex === index)
  if (!pauseMark || pauseMark.duration <= 0) {
    return ''
  }
  
  const duration = pauseMark.duration
  if (duration >= 100) {
    return '99+'
  }
  
  // 格式化显示：整数部分 + 's'
  const seconds = Math.floor(duration)
  return `${seconds}s`
}

function selectChar(index: number) {
  emit('char-select', index)
}

function hoverChar(index: number) {
  emit('char-hover', index)
}

function unhoverChar(index: number) {
  emit('char-unhover', index)
}

function handleSynthesizeAudio() {
  if (props.currentSegment) {
    emit('synthesize-audio', props.currentSegment)
  }
}

function handlePlayAudio() {
  if (props.currentSegment) {
    emit('play-audio', props.currentSegment)
  }
}

defineExpose({ displayText })
</script>

<style scoped>
/* 内容显示区域 */
.content-display-area {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.content-header h3 {
  margin: 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.content-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.content-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sentence-index {
  color: #409eff;
  font-weight: 500;
}

.sentence-duration {
  color: #67c23a;
  font-weight: 500;
}

.content-text {
  font-size: 18px;
  line-height: 2;
  min-height: 60px;
  padding: 16px;
  background: #333;
  border-radius: 8px;
  border: 1px solid #444;
  word-break: break-all;
}

.char {
  display: inline-block;
  padding: 2px 4px;
  margin: 1px 3px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

/* 停顿后的字符增加左边距 */
.char.after-pause {
  margin-left: 24px;
}

.char.word {
  padding: 4px 8px;
  margin: 2px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 6px;
  font-weight: 500;
}

/* 英文单词在停顿后的间距调整 */
.char.word.after-pause {
  margin-left: 4px;
}

.char:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: scale(1.1);
}

.char.word:hover {
  background: rgba(64, 158, 255, 0.3);
  border-color: rgba(64, 158, 255, 0.6);
  transform: scale(1.05);
}

.char.hovered {
  background: rgba(64, 158, 255, 0.3);
  transform: scale(1.05);
}

.char.word.hovered {
  background: rgba(64, 158, 255, 0.4);
  border-color: rgba(64, 158, 255, 0.8);
  transform: scale(1.02);
}

.char.selected {
  background: #409eff;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.char.word.selected {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

/* 停顿时间显示 */
.char.has-pause::after {
  content: attr(data-pause-duration);
  position: absolute;
  top: -12px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  background: #f56c6c;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-size: 10px;
  font-weight: bold;
  color: white;
  padding: 0 0px;
  white-space: nowrap;
}

/* 多音字标记图标 */
.char.has-pronunciation::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  width: 18px;
  height: 18px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/%3E%3C/svg%3E");
  background-size: 12px 12px;
  background-repeat: no-repeat;
  background-position: center;
}

/* 同时有停顿和多音字标记的字符 - 调整位置避免重叠 */
.char.has-pause.has-pronunciation::after {
  top: -14px;
  right: -12px;
  min-width: 18px;
  height: 14px;
  font-size: 9px;
  padding: 0 3px;
}

.char.has-pause.has-pronunciation::before {
  top: -12px;
  left: -12px;
  width: 16px;
  height: 16px;
  background-size: 10px 10px;
}

/* 操作按钮样式 */
.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-btn:active {
  transform: scale(0.95);
}

.synthesize-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.synthesize-btn:hover {
  background: linear-gradient(135deg, #85ce61 0%, #a4da89 100%);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.play-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.play-btn:hover {
  background: linear-gradient(135deg, #66b1ff 0%, #8cc5ff 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.play-btn:disabled {
  background: linear-gradient(135deg, #c0c4cc 0%, #d3d4d6 100%);
  color: #a8abb2;
  cursor: not-allowed;
  transform: none;
}

.play-btn:disabled:hover {
  background: linear-gradient(135deg, #c0c4cc 0%, #d3d4d6 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transform: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: all 0.3s ease;
}

.btn-icon svg {
  width: 100%;
  height: 100%;
}
</style>

<script lang="ts">
export default {
  name: 'SentenceContentDisplay'
}
</script>