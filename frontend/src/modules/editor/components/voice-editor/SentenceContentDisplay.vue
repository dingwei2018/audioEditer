<template>
  <div class="content-display-area">
    <div class="content-header">
      <h3>句子内容</h3>
      <div class="content-info">
        <span class="sentence-index">句子 #{{ sentenceIndex + 1 }}</span>
        <span class="sentence-duration">{{ sentenceDuration }}s</span>
      </div>
    </div>

    <div class="content-text" ref="contentTextRef">
      <span
        v-for="(char, index) in displayText"
        :key="index"
        :class="getCharClass(index)"
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
import { ref, computed } from 'vue'

interface PauseMark {
  charIndex: number
  duration: number
}

interface PronunciationMark {
  charIndex: number
  pinyin: string
}

interface Props {
  sentenceText: string
  sentenceIndex: number
  sentenceDuration: number
  selectedCharIndex: number | null
  hoveredCharIndex: number | null
  pauseMarks: PauseMark[]
  pronunciationMarks: PronunciationMark[]
}

interface Emits {
  (e: 'char-select', index: number): void
  (e: 'char-hover', index: number): void
  (e: 'char-unhover', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contentTextRef = ref<HTMLElement>()

// 计算属性
const displayText = computed(() => {
  return splitTextByWords(props.sentenceText)
})

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

  return classes.join(' ')
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
  margin: 1px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.char.word {
  padding: 4px 8px;
  margin: 2px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 6px;
  font-weight: 500;
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

.char.has-pause::after {
  content: '⏸';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 10px;
  color: #f56c6c;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.char.has-pronunciation::before {
  content: '🎵';
  position: absolute;
  top: -8px;
  left: -8px;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>